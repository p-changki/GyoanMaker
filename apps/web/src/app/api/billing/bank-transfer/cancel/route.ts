import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import type { PendingOrder } from "@gyoanmaker/shared/plans";

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { orderId?: string };
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

  if (!orderId) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "orderId is required." } },
      { status: 400 }
    );
  }

  const db = getDb();
  const orderRef = db.collection("pending_orders").doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found." } },
      { status: 404 }
    );
  }

  const order = snap.data() as PendingOrder;

  if (order.email?.toLowerCase() !== email) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Not your order." } },
      { status: 403 }
    );
  }

  if (order.checkoutFlow !== "bank_transfer") {
    return NextResponse.json(
      { error: { code: "INVALID_FLOW", message: "Not a bank transfer order." } },
      { status: 400 }
    );
  }

  if (order.status !== "awaiting_deposit") {
    return NextResponse.json(
      { error: { code: "INVALID_STATUS", message: "이미 처리된 주문은 취소할 수 없습니다." } },
      { status: 400 }
    );
  }

  await orderRef.set(
    {
      status: "failed",
      failedAt: new Date().toISOString(),
      errorMessage: "사용자 취소",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, orderId });
}
