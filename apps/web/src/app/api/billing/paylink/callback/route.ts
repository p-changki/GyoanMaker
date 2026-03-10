import { NextRequest, NextResponse } from "next/server";
import { applyPaylinkOrder } from "@/lib/paylink-confirm";
import { TossPaymentError } from "@/lib/payment";

interface PaylinkCallbackPayload {
  orderNo?: string;
  payStatus?: string;
}

const PAYLINK_COMPLETED_STATUSES = new Set([
  "PAY_COMPLETE",
  "PAY_APPROVED",
  "SETTLEMENT_COMPLETE",
]);

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as PaylinkCallbackPayload | null;
  const orderId = typeof payload?.orderNo === "string" ? payload.orderNo : "";
  const payStatus = typeof payload?.payStatus === "string" ? payload.payStatus : "";

  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: "missing_orderNo" });
  }

  if (payStatus && !PAYLINK_COMPLETED_STATUSES.has(payStatus)) {
    return NextResponse.json({ ok: true, ignored: `status_${payStatus}` });
  }

  try {
    const result = await applyPaylinkOrder(orderId);
    return NextResponse.json({ ok: true, result: result.kind });
  } catch (error) {
    if (error instanceof TossPaymentError) {
      console.error("[billing/paylink/callback] Toss error:", error.code, error.message);
      return NextResponse.json({ ok: false, error: error.code ?? "PAYLINK_ERROR" }, { status: 500 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[billing/paylink/callback] error:", message);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
