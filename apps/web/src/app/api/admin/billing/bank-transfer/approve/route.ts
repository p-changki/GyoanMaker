import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getDb } from "@/lib/firebase-admin";
import { addTopUpCredits, changePlan } from "@/lib/subscription";
import { sendOrderApprovedEmail } from "@/lib/email";
import { TOP_UP_PACKAGES, type PendingOrder } from "@gyoanmaker/shared/plans";

export async function POST(req: NextRequest) {
  const session = await auth();
  const adminEmail = session?.user?.email;
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  if (order.checkoutFlow !== "bank_transfer") {
    return NextResponse.json(
      { error: { code: "INVALID_FLOW", message: "Not a bank transfer order." } },
      { status: 400 }
    );
  }

  if (order.status === "confirmed") {
    return NextResponse.json({ ok: true, orderId, message: "Already confirmed." });
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

  const email = order.email?.toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: { code: "INVALID_ORDER", message: "Order missing email." } },
      { status: 400 }
    );
  }

  const orderType = order.type === "topup" ? "topup" : "plan";

  try {
    let subscriptionResult: unknown;
    let creditsResult: unknown;

    if (orderType === "plan") {
      if (!order.planId) {
        return NextResponse.json(
          { error: { code: "INVALID_ORDER", message: "Missing planId." } },
          { status: 400 }
        );
      }
      subscriptionResult = await changePlan(email, order.planId);
    }

    if (orderType === "topup") {
      if (!order.packageId) {
        return NextResponse.json(
          { error: { code: "INVALID_ORDER", message: "Missing packageId." } },
          { status: 400 }
        );
      }
      const pkg = TOP_UP_PACKAGES.find((p) => p.id === order.packageId);
      if (!pkg) {
        return NextResponse.json(
          { error: { code: "INVALID_ORDER", message: "Package not found." } },
          { status: 400 }
        );
      }
      creditsResult = await addTopUpCredits(email, pkg.type, pkg.amount, orderId);
    }

    const confirmedAt = new Date().toISOString();
    const payload = {
      status: "confirmed" as const,
      confirmedAt,
      approvedBy: adminEmail ?? "admin",
      errorMessage: FieldValue.delete(),
      updatedAt: confirmedAt,
    };

    const billingRef = db.collection("billing_orders").doc(orderId);
    await db.runTransaction(async (tx) => {
      tx.set(orderRef, payload, { merge: true });
      tx.set(billingRef, { ...order, type: orderType, ...payload }, { merge: true });
    });

    // Fire-and-forget: email failure must not roll back approval
    sendOrderApprovedEmail({
      orderId,
      orderName: order.orderName,
      amount: order.amount,
      email,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      orderId,
      type: orderType,
      subscription: subscriptionResult,
      credits: creditsResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/bank-transfer/approve] ${message}`);

    await orderRef.set(
      {
        status: "paid_not_applied",
        paidNotAppliedAt: new Date().toISOString(),
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const clientMessage =
      message.includes("Firebase") || message.includes("Firestore")
        ? "서비스 적용 중 오류가 발생했습니다."
        : message;

    return NextResponse.json(
      { error: { code: "APPROVE_FAILED", message: clientMessage } },
      { status: 500 }
    );
  }
}
