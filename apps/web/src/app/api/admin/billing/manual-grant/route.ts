import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getDb } from "@/lib/firebase-admin";
import { changePlanManual } from "@/lib/subscription";
import type { PlanId } from "@gyoanmaker/shared/plans";

const VALID_PLANS = new Set<string>(["free", "basic", "standard", "pro"]);

/**
 * POST /api/admin/billing/manual-grant
 * Manually grants a plan to a user and creates a billing record.
 *
 * Body:
 *   email: string           — target user email
 *   planId: PlanId          — plan to grant
 *   periodEndAt: string     — ISO date string for plan expiry (e.g. "2025-04-12")
 *   amount: number          — payment amount (for record keeping, optional)
 *   memo: string            — admin memo (optional)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const adminEmail = session?.user?.email;
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    planId?: string;
    periodEndAt?: string;
    amount?: number;
    memo?: string;
  };

  const targetEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!targetEmail) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "email is required." } },
      { status: 400 }
    );
  }

  if (!body.planId || !VALID_PLANS.has(body.planId)) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Valid planId is required." } },
      { status: 400 }
    );
  }

  const planId = body.planId as PlanId;

  // Validate periodEndAt format if provided
  let periodEndAt: string | null = null;
  if (planId !== "free" && body.periodEndAt) {
    const parsed = new Date(body.periodEndAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: "Invalid periodEndAt date." } },
        { status: 400 }
      );
    }
    // Store as end-of-day ISO
    parsed.setHours(23, 59, 59, 999);
    periodEndAt = parsed.toISOString();
  }

  const amount = typeof body.amount === "number" && body.amount >= 0 ? body.amount : 0;
  const memo = typeof body.memo === "string" ? body.memo.trim().slice(0, 500) : "";

  try {
    // 1. Grant the plan with custom end date
    const subscription = await changePlanManual(targetEmail, planId, periodEndAt);

    // 2. Create billing record for audit trail
    const now = new Date().toISOString();
    const orderId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const db = getDb();
    await db.collection("billing_orders").doc(orderId).set({
      orderId,
      email: targetEmail,
      type: "plan",
      planId,
      packageId: null,
      amount,
      status: "confirmed",
      checkoutFlow: "manual",
      confirmedAt: now,
      createdAt: now,
      approvedBy: adminEmail ?? "admin",
      periodEndAt: periodEndAt ?? null,
      memo: memo || null,
      depositorName: null,
      receiptType: null,
      receiptPhone: null,
      taxInvoiceInfo: null,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      email: targetEmail,
      subscription,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/manual-grant] ${message}`);
    return NextResponse.json(
      { error: { code: "GRANT_FAILED", message } },
      { status: 500 }
    );
  }
}
