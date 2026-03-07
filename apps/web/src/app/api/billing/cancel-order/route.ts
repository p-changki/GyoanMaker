import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import type { PendingOrder } from "@gyoanmaker/shared/plans";

interface CancelOrderBody {
  orderId?: string;
  reason?: string;
}

/**
 * POST /api/billing/cancel-order — Mark a pending order as failed (user-initiated cancel)
 *
 * Called when:
 * - User cancels on Toss payment page → redirected to /billing/fail with orderId
 * - Only cancels orders in "pending" status owned by the authenticated user
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as CancelOrderBody;
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason : "User canceled payment.";

  if (!orderId) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "orderId is required." } },
      { status: 400 }
    );
  }

  const orderRef = getDb().collection("pending_orders").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return NextResponse.json({ ok: true, skipped: true, reason: "ORDER_NOT_FOUND" });
  }

  const order = orderSnap.data() as PendingOrder;

  if (order.email.toLowerCase() !== email) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You do not own this order." } },
      { status: 403 }
    );
  }

  // Only cancel orders that are still pending
  if (order.status !== "pending") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "ORDER_NOT_PENDING",
      currentStatus: order.status,
    });
  }

  const now = new Date().toISOString();
  await orderRef.set(
    {
      status: "failed",
      failedAt: now,
      errorMessage: reason,
      updatedAt: now,
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, orderId, canceled: true });
}
