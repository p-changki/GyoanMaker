import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import { confirmTossPayment, TossPaymentError } from "@/lib/payment";
import { addTopUpCredits, changePlan, schedulePlanChange } from "@/lib/subscription";
import { sendAdminPurchaseNotificationEmail } from "@/lib/email";
import { billingConfirmLimiter } from "@/lib/rate-limit";
import {
  type PendingOrder,
  TOP_UP_PACKAGES,
} from "@gyoanmaker/shared/plans";

interface ConfirmBody {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
}

function normalizeOrderType(value: unknown): "plan" | "topup" {
  return value === "topup" ? "topup" : "plan";
}

type AcquireOrderResult =
  | { kind: "acquired"; order: PendingOrder }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "already_confirmed" }
  | { kind: "already_failed" }
  | { kind: "amount_mismatch" }
  | { kind: "payment_key_mismatch" }
  | { kind: "in_progress" };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function toClientPaymentErrorMessage(): string {
  return "Payment confirmation failed. Please try again.";
}

function toClientApplyErrorMessage(): string {
  return "Payment succeeded, but post-processing failed. Please retry or contact support.";
}

function hasRecentConfirmingLock(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const lockedAtMs = new Date(value).getTime();
  if (!Number.isFinite(lockedAtMs)) {
    return true;
  }

  const TEN_MINUTES_MS = 10 * 60 * 1000;
  return Date.now() - lockedAtMs <= TEN_MINUTES_MS;
}

async function acquirePendingOrderForConfirm(
  orderId: string,
  email: string,
  paymentKey: string,
  amount: number
): Promise<AcquireOrderResult> {
  const orderRef = getDb().collection("pending_orders").doc(orderId);

  return getDb().runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      return { kind: "not_found" };
    }

    const orderDoc = orderSnap.data() as PendingOrder & {
      confirmingAt?: string;
    };

    if (orderDoc.email.toLowerCase() !== email) {
      return { kind: "forbidden" };
    }

    if (orderDoc.status === "confirmed") {
      return { kind: "already_confirmed" };
    }

    if (orderDoc.status === "failed") {
      return { kind: "already_failed" };
    }

    if (orderDoc.amount !== amount) {
      return { kind: "amount_mismatch" };
    }

    if (orderDoc.paymentKey && orderDoc.paymentKey !== paymentKey) {
      return { kind: "payment_key_mismatch" };
    }

    if (hasRecentConfirmingLock(orderDoc.confirmingAt)) {
      return { kind: "in_progress" };
    }

    const nowIso = new Date().toISOString();
    tx.set(
      orderRef,
      {
        confirmingAt: nowIso,
        paymentKey,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return {
      kind: "acquired",
      order: orderDoc,
    };
  });
}

async function markOrderFailed(orderId: string, message: string, paymentKey?: string) {
  await getDb()
    .collection("pending_orders")
    .doc(orderId)
    .set(
      {
        status: "failed",
        failedAt: new Date().toISOString(),
        paymentKey: paymentKey ?? null,
        errorMessage: message,
        confirmingAt: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

async function markOrderPaidNotApplied(
  orderId: string,
  message: string,
  paymentKey: string,
  confirmedAmount: number
) {
  await getDb()
    .collection("pending_orders")
    .doc(orderId)
    .set(
      {
        status: "paid_not_applied",
        paymentKey,
        confirmedAmount,
        errorMessage: message,
        paidNotAppliedAt: new Date().toISOString(),
        confirmingAt: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  if (!billingConfirmLimiter.check(email)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as ConfirmBody;
  const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey : "";
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const amount = typeof body.amount === "number" ? body.amount : NaN;

  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "paymentKey, orderId, amount are required.",
        },
      },
      { status: 400 }
    );
  }

  const acquireResult = await acquirePendingOrderForConfirm(
    orderId,
    email,
    paymentKey,
    amount
  );

  if (acquireResult.kind === "not_found") {
    return NextResponse.json(
      {
        error: {
          code: "ORDER_NOT_FOUND",
          message: "Pending order not found.",
        },
      },
      { status: 404 }
    );
  }

  if (acquireResult.kind === "forbidden") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You do not own this order." } },
      { status: 403 }
    );
  }

  if (acquireResult.kind === "already_confirmed") {
    return NextResponse.json({
      ok: true,
      alreadyConfirmed: true,
      orderId,
    });
  }

  if (acquireResult.kind === "already_failed") {
    return NextResponse.json(
      {
        error: {
          code: "ORDER_ALREADY_FAILED",
          message: "Order is already marked as failed.",
        },
      },
      { status: 409 }
    );
  }

  if (acquireResult.kind === "amount_mismatch") {
    return NextResponse.json(
      {
        error: {
          code: "AMOUNT_MISMATCH",
          message: "Amount mismatch detected.",
        },
      },
      { status: 400 }
    );
  }

  if (acquireResult.kind === "payment_key_mismatch") {
    return NextResponse.json(
      {
        error: {
          code: "PAYMENT_KEY_MISMATCH",
          message: "paymentKey mismatch for this order.",
        },
      },
      { status: 400 }
    );
  }

  if (acquireResult.kind === "in_progress") {
    return NextResponse.json(
      {
        error: {
          code: "ORDER_CONFIRM_IN_PROGRESS",
          message: "Order confirmation is in progress.",
        },
      },
      { status: 409 }
    );
  }

  const order = acquireResult.order;
  const orderRef = getDb().collection("pending_orders").doc(orderId);
  const orderType = normalizeOrderType((order as { type?: unknown }).type);
  const isRetry = order.status === "paid_not_applied";

  let confirmed;
  try {
    if (isRetry) {
      // Payment already confirmed with Toss — skip re-confirm, proceed to apply
      confirmed = {
        totalAmount: order.amount,
        status: "DONE",
        method: null as string | null,
        approvedAt: null as string | null,
        paymentKey,
        orderId,
      };
    } else {
      confirmed = await confirmTossPayment(paymentKey, orderId, amount);

      if (confirmed.totalAmount !== order.amount) {
        await markOrderFailed(orderId, "Confirmed amount mismatch.", paymentKey);
        return NextResponse.json(
          {
            error: {
              code: "CONFIRMED_AMOUNT_MISMATCH",
              message: "Confirmed amount does not match pending order.",
            },
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    // Toss confirm itself failed — payment not charged, mark as failed
    const message = getErrorMessage(error);
    await markOrderFailed(orderId, message, paymentKey).catch(() => undefined);
    console.error("[billing/confirm] payment confirmation failed:", message);

    if (error instanceof TossPaymentError) {
      return NextResponse.json(
        {
          error: {
            code: error.code ?? "TOSS_CONFIRM_ERROR",
            message: toClientPaymentErrorMessage(),
          },
        },
        { status: error.statusCode ?? 502 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "BILLING_CONFIRM_ERROR",
          message: toClientPaymentErrorMessage(),
        },
      },
      { status: 500 }
    );
  }

  // Toss confirm succeeded — now apply plan/credits
  try {
    // Idempotency: if this order was already applied (retry scenario), skip re-application
    if (isRetry) {
      const existingOrder = await getDb().collection("billing_orders").doc(orderId).get();
      if (existingOrder.exists && existingOrder.data()?.status === "confirmed") {
        await orderRef.set({ confirmingAt: FieldValue.delete() }, { merge: true });
        return NextResponse.json({ ok: true, orderId, type: orderType, alreadyApplied: true });
      }
    }

    let subscriptionResult: unknown;
    let creditsResult: unknown;

    if (orderType === "plan") {
      if (!order.planId) {
        await markOrderPaidNotApplied(orderId, "Missing planId for plan order.", paymentKey, confirmed.totalAmount);
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ORDER",
              message: "Missing planId in order.",
            },
          },
          { status: 400 }
        );
      }

      if ((order as { scheduled?: boolean }).scheduled) {
        // Scheduled downgrade: defer plan application to current period end
        subscriptionResult = await schedulePlanChange(email, order.planId);
      } else {
        subscriptionResult = await changePlan(email, order.planId, {
          changedBy: "user",
          reason: "payment_confirmed",
        });
      }
    }

    if (orderType === "topup") {
      if (!order.packageId) {
        await markOrderPaidNotApplied(orderId, "Missing packageId for top-up order.", paymentKey, confirmed.totalAmount);
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ORDER",
              message: "Missing packageId in order.",
            },
          },
          { status: 400 }
        );
      }

      const selectedPackage = TOP_UP_PACKAGES.find((pkg) => pkg.id === order.packageId);
      if (!selectedPackage) {
        await markOrderPaidNotApplied(orderId, "Top-up package not found.", paymentKey, confirmed.totalAmount);
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ORDER_PACKAGE",
              message: "Top-up package not found.",
            },
          },
          { status: 400 }
        );
      }

      creditsResult = await addTopUpCredits(
        email,
        selectedPackage.type,
        selectedPackage.amount,
        orderId
      );
    }

    const confirmedAt = new Date().toISOString();
    const isScheduled = !!(order as { scheduled?: boolean }).scheduled;
    const billingOrderPayload = {
      ...order,
      type: orderType,
      status: "confirmed" as const,
      confirmedAt,
      paymentKey,
      paymentStatus: confirmed.status,
      confirmedAmount: confirmed.totalAmount,
      paymentMethod: confirmed.method,
      approvedAt: confirmed.approvedAt,
      refundStatus: order.refundStatus ?? "none",
      refundAmount: order.refundAmount ?? 0,
      ...(isScheduled ? { scheduled: true, scheduledApplyAt: (subscriptionResult as { planPendingApplyAt?: string | null })?.planPendingApplyAt ?? null } : {}),
      updatedAt: confirmedAt,
    };

    await Promise.all([
      orderRef.set(
        {
          ...billingOrderPayload,
          confirmingAt: FieldValue.delete(),
        },
        { merge: true }
      ),
      getDb().collection("billing_orders").doc(orderId).set(billingOrderPayload),
    ]);

    // Fire-and-forget: admin purchase notification
    sendAdminPurchaseNotificationEmail({
      buyerEmail: email,
      orderId,
      orderName: order.orderName,
      amount: confirmed.totalAmount,
      orderType,
    }).catch((err) => console.error("[billing/confirm] admin notification failed:", err));

    return NextResponse.json({
      ok: true,
      orderId,
      type: orderType,
      subscription: subscriptionResult,
      credits: creditsResult,
    });
  } catch (error) {
    // Toss payment succeeded but plan/credits application failed
    // Mark as paid_not_applied so user can retry
    const message = getErrorMessage(error);
    await markOrderPaidNotApplied(orderId, message, paymentKey, confirmed.totalAmount).catch(() => undefined);
    console.error("[billing/confirm] apply-after-payment failed:", message);

    return NextResponse.json(
      {
        error: {
          code: "APPLY_AFTER_PAYMENT_ERROR",
          message: toClientApplyErrorMessage(),
        },
      },
      { status: 500 }
    );
  }
}
