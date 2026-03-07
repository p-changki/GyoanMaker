import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { changePlan, renewSubscription, markPlanPastDue } from "@/lib/subscription";
import { getBillingKey, chargeBillingKey } from "@/lib/billing-key";
import { type PlanId, PLANS } from "@gyoanmaker/shared/plans";

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
}

interface UserDocForCron {
  plan?: {
    tier?: string;
    status?: string;
    currentPeriodEndAt?: string | null;
  };
  planPendingTier?: string;
  billingKey?: {
    key?: string;
    customerKey?: string;
  };
}

function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

interface PendingApplyResult {
  email: string;
  targetTier: PlanId;
  success: boolean;
  error?: string;
}

interface RenewalResult {
  email: string;
  tier: PlanId;
  success: boolean;
  error?: string;
}

function generateOrderId(email: string): string {
  const timestamp = Date.now().toString(36);
  const suffix = Math.random().toString(36).slice(2, 6);
  const prefix = email.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  return `renew_${prefix}_${timestamp}_${suffix}`;
}

async function applyPendingPlans(now: Date): Promise<PendingApplyResult[]> {
  const db = getDb();
  const snap = await db
    .collection("users")
    .where("planPendingTier", "in", ["free", "basic", "standard", "pro"])
    .get();

  const results: PendingApplyResult[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as UserDocForCron;
    const pendingTier = data.planPendingTier;

    if (!isPlanId(pendingTier)) {
      continue;
    }

    const periodEnd = data.plan?.currentPeriodEndAt;
    if (!periodEnd) {
      continue;
    }

    if (new Date(periodEnd) > now) {
      continue;
    }

    try {
      await changePlan(doc.id, pendingTier, { forceImmediate: true });
      results.push({ email: doc.id, targetTier: pendingTier, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({
        email: doc.id,
        targetTier: pendingTier,
        success: false,
        error: message,
      });
    }
  }

  return results;
}

async function processAutoRenewals(now: Date): Promise<RenewalResult[]> {
  const db = getDb();

  // Query: paid users whose period has ended, not canceled, not pending downgrade
  const snap = await db.collection("users").get();

  const results: RenewalResult[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as UserDocForCron;
    const tier = data.plan?.tier;
    const status = data.plan?.status;
    const periodEnd = data.plan?.currentPeriodEndAt;
    const hasPending = !!data.planPendingTier;

    // Skip: free, canceled, has pending tier (already handled by applyPendingPlans)
    if (!isPlanId(tier) || tier === "free") continue;
    if (status === "canceled") continue;
    if (hasPending) continue;
    if (!periodEnd) continue;
    if (new Date(periodEnd) > now) continue;

    // Must have billing key
    const billingKeyInfo = await getBillingKey(doc.id);
    if (!billingKeyInfo) continue;

    const plan = PLANS[tier];
    const orderId = generateOrderId(doc.id);
    const orderName = `${tier.toUpperCase()} Plan Auto-Renewal`;

    try {
      const chargeResult = await chargeBillingKey(
        billingKeyInfo.key,
        billingKeyInfo.customerKey,
        plan.price,
        orderId,
        orderName
      );

      await renewSubscription(doc.id);

      // Record in billing_orders
      const confirmedAt = new Date().toISOString();
      await db.collection("billing_orders").doc(orderId).set({
        orderId,
        email: doc.id,
        type: "subscription",
        planId: tier,
        orderName,
        amount: plan.price,
        status: "confirmed",
        createdAt: confirmedAt,
        confirmedAt,
        paymentKey: chargeResult.paymentKey,
        paymentStatus: chargeResult.status,
        confirmedAmount: chargeResult.totalAmount,
        approvedAt: chargeResult.approvedAt,
        autoRenewal: true,
      });

      results.push({ email: doc.id, tier, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";

      try {
        await markPlanPastDue(doc.id);
      } catch {
        // Best-effort: log marking failure
      }

      results.push({ email: doc.id, tier, success: false, error: message });
    }
  }

  return results;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid CRON_SECRET." } },
      { status: 401 }
    );
  }

  const now = new Date();

  try {
    // Phase 1: Apply pending plan downgrades
    const pendingResults = await applyPendingPlans(now);

    // Phase 2: Auto-renew paid users with billing key
    const renewalResults = await processAutoRenewals(now);

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      pendingApply: {
        processed: pendingResults.length,
        results: pendingResults,
      },
      autoRenewal: {
        processed: renewalResults.length,
        results: renewalResults,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "CRON_ERROR", message } },
      { status: 500 }
    );
  }
}
