import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";
import { sendOrderRejectedEmail } from "@gyoanmaker/server-lib/email";
import type { PendingOrder } from "@gyoanmaker/shared/plans";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    orderId?: string;
    reason?: string;
  };
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

  if (order.checkoutFlow !== "bank_transfer") {
    return NextResponse.json(
      { error: { code: "INVALID_FLOW", message: "Not a bank transfer order." } },
      { status: 400 }
    );
  }

  if (order.status !== "awaiting_deposit") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATUS",
          message: `Order status is "${order.status}", expected "awaiting_deposit".`,
        },
      },
      { status: 400 }
    );
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "관리자 거절";

  await orderRef.set(
    {
      status: "failed",
      failedAt: new Date().toISOString(),
      errorMessage: reason,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // Fire-and-forget: email failure must not affect rejection
  if (order.email) {
    sendOrderRejectedEmail(
      {
        orderId,
        orderName: order.orderName,
        amount: order.amount,
        email: order.email,
      },
      reason
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, orderId });
}
