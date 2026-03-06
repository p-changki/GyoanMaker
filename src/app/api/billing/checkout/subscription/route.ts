import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processPayment } from "@/lib/payment";
import { type PlanId, PLANS } from "@/lib/plans";
import { changePlan } from "@/lib/subscription";
import { getDb } from "@/lib/firebase-admin";

function createRequestId(req: NextRequest): string {
  return req.headers.get("x-idempotency-key")?.trim() || crypto.randomUUID();
}

function getLogId(email: string, idempotencyKey: string): string {
  return `sub_${Buffer.from(`${email}:${idempotencyKey}`).toString("base64url")}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    planId?: PlanId;
    idempotencyKey?: string;
  };
  const planId = body.planId;

  if (!planId || !(planId in PLANS)) {
    return NextResponse.json(
      { error: { code: "INVALID_PLAN", message: "유효한 planId가 필요합니다." } },
      { status: 400 }
    );
  }

  const amount = PLANS[planId].price;
  const idempotencyKey = body.idempotencyKey || createRequestId(req);
  const logId = getLogId(email, idempotencyKey);
  const logRef = getDb().collection("billing_logs").doc(logId);
  const existing = await logRef.get();

  if (existing.exists) {
    const data = existing.data() ?? {};
    return NextResponse.json({
      ok: true,
      replayed: true,
      transactionId: data.transactionId,
      plan: data.planSnapshot,
    });
  }

  const payment = await processPayment({
    type: "subscription",
    planId,
    amount,
    email,
    idempotencyKey,
  });

  if (!payment.success) {
    return NextResponse.json(
      { error: { code: "PAYMENT_FAILED", message: "결제에 실패했습니다." } },
      { status: 402 }
    );
  }

  const plan = await changePlan(email, planId);
  await logRef.set({
    email: email.toLowerCase(),
    type: "subscription",
    planId,
    amount,
    method: payment.method,
    status: "success",
    transactionId: payment.transactionId,
    idempotencyKey,
    planSnapshot: plan,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    transactionId: payment.transactionId,
    plan,
  });
}
