import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";
import { addTopUpCredits, changePlan } from "@gyoanmaker/server-lib/subscription";
import { TOP_UP_PACKAGES, type PendingOrder } from "@gyoanmaker/shared/plans";

function normalizeOrderType(value: unknown): "plan" | "topup" {
  return value === "topup" ? "topup" : "plan";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
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

  const order = snap.data() as PendingOrder & {
    type?: string;
    paymentKey?: string;
    confirmedAmount?: number;
  };
  const orderType = normalizeOrderType(order.type);

  if (order.status !== "paid_not_applied") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATUS",
          message: `Order status is "${order.status}", not "paid_not_applied".`,
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
      retryAppliedAt: confirmedAt,
      retryAppliedBy: session?.user?.email ?? "admin",
      errorMessage: FieldValue.delete(),
      confirmingAt: FieldValue.delete(),
      updatedAt: confirmedAt,
    };

    await Promise.all([
      orderRef.set(payload, { merge: true }),
      db.collection("billing_orders").doc(orderId).set(
        {
          ...order,
          type: orderType,
          ...payload,
          confirmingAt: FieldValue.delete(),
          errorMessage: FieldValue.delete(),
        },
        { merge: true }
      ),
    ]);

    return NextResponse.json({
      ok: true,
      orderId,
      type: orderType,
      subscription: subscriptionResult,
      credits: creditsResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/retry-apply] ${message}`);
    return NextResponse.json(
      {
        error: {
          code: "RETRY_APPLY_ERROR",
          message: `Failed to apply: ${message}`,
        },
      },
      { status: 500 }
    );
  }
}
