import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import { processPayment } from "@/lib/payment";
import { TOP_UP_PACKAGES, type TopUpPackageId } from "@/lib/plans";
import { addTopUpCredits } from "@/lib/subscription";

function createRequestId(req: NextRequest): string {
  return req.headers.get("x-idempotency-key")?.trim() || crypto.randomUUID();
}

function getLogId(email: string, idempotencyKey: string): string {
  return `topup_${Buffer.from(`${email}:${idempotencyKey}`).toString("base64url")}`;
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
    packageId?: TopUpPackageId;
    idempotencyKey?: string;
  };
  const pkg = TOP_UP_PACKAGES.find((item) => item.id === body.packageId);

  if (!pkg) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PACKAGE",
          message: "유효한 packageId가 필요합니다.",
        },
      },
      { status: 400 }
    );
  }

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
      credits: data.creditsSnapshot,
    });
  }

  const payment = await processPayment({
    type: "topup",
    packageId: pkg.id,
    amount: pkg.price,
    email,
    idempotencyKey,
  });

  if (!payment.success) {
    return NextResponse.json(
      { error: { code: "PAYMENT_FAILED", message: "결제에 실패했습니다." } },
      { status: 402 }
    );
  }

  const credits = await addTopUpCredits(email, pkg.type, pkg.amount);
  await logRef.set({
    email: email.toLowerCase(),
    type: "topup",
    packageId: pkg.id,
    amount: pkg.price,
    creditType: pkg.type,
    creditAmount: pkg.amount,
    method: payment.method,
    status: "success",
    transactionId: payment.transactionId,
    idempotencyKey,
    creditsSnapshot: credits,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    transactionId: payment.transactionId,
    credits,
  });
}
