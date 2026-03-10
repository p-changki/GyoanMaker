import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import type { PlanId } from "@gyoanmaker/shared/plans";

interface UserDocLike {
  plan?: {
    tier?: PlanId;
    status?: string;
    currentPeriodStartAt?: string;
    currentPeriodEndAt?: string | null;
    paymentMethod?: unknown;
  };
  planPendingTier?: unknown;
  billingKey?: unknown;
}

const VALID_PLAN_TIERS: PlanId[] = ["free", "basic", "standard", "pro"];

function hasOwnKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function toValidTier(value: unknown): PlanId {
  return VALID_PLAN_TIERS.includes(value as PlanId) ? (value as PlanId) : "free";
}

function toValidStatus(value: unknown): "active" | "expired" {
  return value === "expired" ? "expired" : "active";
}

function toIsoOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isPast(endAt: string | null, nowMs: number): boolean {
  if (!endAt) return false;
  const endMs = new Date(endAt).getTime();
  return Number.isFinite(endMs) && endMs < nowMs;
}

function resolveSecret(req: NextRequest): string {
  return (
    req.headers.get("x-admin-secret") ??
    req.headers.get("admin-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    ""
  ).trim();
}

export async function POST(req: NextRequest) {
  const expectedSecret = (process.env.ADMIN_SECRET ?? "").trim();
  const providedSecret = resolveSecret(req);

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid admin secret." } },
      { status: 401 }
    );
  }

  const db = getDb();
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const pageSize = 300;

  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let scanned = 0;
  let updated = 0;
  let downgradedPastDue = 0;
  let downgradedCanceled = 0;
  let downgradedExpired = 0;
  let removedPlanPendingTier = 0;
  let removedBillingKey = 0;
  let removedPaymentMethod = 0;

  while (true) {
    let query = db.collection("users").orderBy("__name__").limit(pageSize);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    const batch = db.batch();
    let hasBatchWrites = false;

    for (const doc of snap.docs) {
      scanned += 1;
      lastDoc = doc;

      const raw = (doc.data() ?? {}) as UserDocLike;
      const rawRecord = raw as Record<string, unknown>;
      const rawPlan = (raw.plan ?? {}) as Record<string, unknown>;

      const tier = toValidTier(raw.plan?.tier);
      const status = raw.plan?.status;
      const currentPeriodStartAt =
        typeof raw.plan?.currentPeriodStartAt === "string"
          ? raw.plan.currentPeriodStartAt
          : nowIso;
      const currentPeriodEndAt = toIsoOrNull(raw.plan?.currentPeriodEndAt);

      const shouldDowngradePastDue = status === "past_due";
      const shouldDowngradeCanceled = status === "canceled";
      const shouldDowngradeExpiredActive =
        status === "active" && tier !== "free" && isPast(currentPeriodEndAt, nowMs);
      const shouldDowngrade =
        shouldDowngradePastDue ||
        shouldDowngradeCanceled ||
        shouldDowngradeExpiredActive;

      const hasPlanPendingTier = hasOwnKey(rawRecord, "planPendingTier");
      const hasBillingKey = hasOwnKey(rawRecord, "billingKey");
      const hasPaymentMethod = hasOwnKey(rawPlan, "paymentMethod");

      if (!shouldDowngrade && !hasPlanPendingTier && !hasBillingKey && !hasPaymentMethod) {
        continue;
      }

      const nextTier: PlanId = shouldDowngrade ? "free" : tier;
      const nextStatus: "active" | "expired" = shouldDowngrade ? "active" : toValidStatus(status);
      const nextEndAt = shouldDowngrade ? null : currentPeriodEndAt;

      const payload: Record<string, unknown> = {
        plan: {
          tier: nextTier,
          status: nextStatus,
          currentPeriodStartAt,
          currentPeriodEndAt: nextEndAt,
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (hasPlanPendingTier) {
        payload.planPendingTier = FieldValue.delete();
        removedPlanPendingTier += 1;
      }
      if (hasBillingKey) {
        payload.billingKey = FieldValue.delete();
        removedBillingKey += 1;
      }
      if (hasPaymentMethod) {
        removedPaymentMethod += 1;
      }

      if (shouldDowngradePastDue) downgradedPastDue += 1;
      if (shouldDowngradeCanceled) downgradedCanceled += 1;
      if (shouldDowngradeExpiredActive) downgradedExpired += 1;

      batch.set(doc.ref, payload, { merge: true });
      hasBatchWrites = true;
      updated += 1;
    }

    if (hasBatchWrites) {
      await batch.commit();
    }

    if (snap.size < pageSize) break;
  }

  return NextResponse.json({
    ok: true,
    scanned,
    updated,
    downgraded: {
      pastDue: downgradedPastDue,
      canceled: downgradedCanceled,
      expiredActive: downgradedExpired,
      total: downgradedPastDue + downgradedCanceled + downgradedExpired,
    },
    deletedFields: {
      planPendingTier: removedPlanPendingTier,
      billingKey: removedBillingKey,
      paymentMethod: removedPaymentMethod,
    },
  });
}
