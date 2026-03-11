import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { fetchTossPaylinkStatus } from "./payment";
import { addTopUpCredits, changePlan } from "./subscription";
import { TOP_UP_PACKAGES, type PendingOrder } from "@gyoanmaker/shared/plans";

const COLLECTION = "pending_orders";
const TEN_MINUTES_MS = 10 * 60 * 1000;
const PAYLINK_COMPLETED_STATUSES = new Set([
  "PAY_COMPLETE",
  "PAY_APPROVED",
  "SETTLEMENT_COMPLETE",
]);

type AcquireOrderResult =
  | { kind: "acquired"; order: PendingOrder & { confirmingAt?: string } }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "already_confirmed" }
  | { kind: "already_failed" }
  | { kind: "in_progress" };

export type ApplyPaylinkOrderResult =
  | { kind: "confirmed"; orderId: string; type: "plan" | "topup" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "already_confirmed" }
  | { kind: "already_failed" }
  | { kind: "in_progress" }
  | { kind: "not_completed"; payStatus: string }
  | { kind: "amount_mismatch" };

function normalizeOrderType(value: unknown): "plan" | "topup" {
  return value === "topup" ? "topup" : "plan";
}

function hasRecentConfirmingLock(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const lockedAtMs = new Date(value).getTime();
  if (!Number.isFinite(lockedAtMs)) {
    return true;
  }

  return Date.now() - lockedAtMs <= TEN_MINUTES_MS;
}

async function acquireOrderForPaylinkConfirm(
  orderId: string,
  assertEmail?: string
): Promise<AcquireOrderResult> {
  const orderRef = getDb().collection(COLLECTION).doc(orderId);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) {
      return { kind: "not_found" };
    }

    const order = snap.data() as PendingOrder & { confirmingAt?: string };
    const ownerEmail = order.email.toLowerCase();
    if (assertEmail && ownerEmail !== assertEmail.toLowerCase()) {
      return { kind: "forbidden" };
    }

    if (order.status === "confirmed") {
      return { kind: "already_confirmed" };
    }

    if (order.status === "failed") {
      return { kind: "already_failed" };
    }

    if (hasRecentConfirmingLock(order.confirmingAt)) {
      return { kind: "in_progress" };
    }

    const nowIso = new Date().toISOString();
    tx.set(
      orderRef,
      {
        confirmingAt: nowIso,
        updatedAt: nowIso,
      },
      { merge: true }
    );

    return { kind: "acquired", order };
  });
}

async function clearConfirmingLock(orderId: string, payStatus?: string) {
  await getDb()
    .collection(COLLECTION)
    .doc(orderId)
    .set(
      {
        confirmingAt: FieldValue.delete(),
        ...(payStatus ? { payStatus } : {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

async function markOrderFailed(orderId: string, message: string, payToken?: string | null) {
  await getDb()
    .collection(COLLECTION)
    .doc(orderId)
    .set(
      {
        status: "failed",
        failedAt: new Date().toISOString(),
        errorMessage: message,
        ...(payToken ? { payToken } : {}),
        confirmingAt: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

async function markOrderPaidNotApplied(
  orderId: string,
  message: string,
  payToken: string | null
) {
  await getDb()
    .collection(COLLECTION)
    .doc(orderId)
    .set(
      {
        status: "paid_not_applied",
        errorMessage: message,
        ...(payToken ? { payToken } : {}),
        paidNotAppliedAt: new Date().toISOString(),
        confirmingAt: FieldValue.delete(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
}

export async function applyPaylinkOrder(
  orderId: string,
  options?: { assertEmail?: string }
): Promise<ApplyPaylinkOrderResult> {
  const acquired = await acquireOrderForPaylinkConfirm(orderId, options?.assertEmail);
  if (acquired.kind !== "acquired") {
    return acquired;
  }

  const { order } = acquired;
  const orderType = normalizeOrderType(order.type);

  let status: Awaited<ReturnType<typeof fetchTossPaylinkStatus>>;
  try {
    status = await fetchTossPaylinkStatus({
      orderNo: orderId,
      payToken: order.payToken,
    });
  } catch (error) {
    await clearConfirmingLock(orderId);
    throw error;
  }

  if (!PAYLINK_COMPLETED_STATUSES.has(status.payStatus)) {
    await clearConfirmingLock(orderId, status.payStatus);
    return { kind: "not_completed", payStatus: status.payStatus };
  }

  if (status.amount !== order.amount) {
    await markOrderFailed(orderId, "Paylink confirmed amount mismatch.", status.payToken);
    return { kind: "amount_mismatch" };
  }

  try {
    if (orderType === "plan") {
      if (!order.planId) {
        await markOrderPaidNotApplied(orderId, "Missing planId for plan order.", status.payToken);
        throw new Error("Missing planId in paylink order.");
      }

      await changePlan(order.email, order.planId);
    } else {
      if (!order.packageId) {
        await markOrderPaidNotApplied(orderId, "Missing packageId for top-up order.", status.payToken);
        throw new Error("Missing packageId in paylink top-up order.");
      }

      const selectedPackage = TOP_UP_PACKAGES.find((pkg) => pkg.id === order.packageId);
      if (!selectedPackage) {
        await markOrderPaidNotApplied(orderId, "Top-up package not found.", status.payToken);
        throw new Error("Top-up package not found.");
      }

      await addTopUpCredits(
        order.email,
        selectedPackage.type,
        selectedPackage.amount,
        orderId
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown apply error";
    await markOrderPaidNotApplied(orderId, message, status.payToken);
    throw error;
  }

  const confirmedAt = new Date().toISOString();
  const billingOrderPayload = {
    ...order,
    type: orderType,
    status: "confirmed" as const,
    checkoutFlow: "paylink" as const,
    confirmedAt,
    paymentKey: status.payToken,
    paymentStatus: status.payStatus,
    confirmedAmount: status.amount,
    paymentMethod: status.payMethod,
    approvedAt: confirmedAt,
    refundStatus: order.refundStatus ?? "none",
    refundAmount: order.refundAmount ?? 0,
    updatedAt: confirmedAt,
  };

  await Promise.all([
    getDb()
      .collection(COLLECTION)
      .doc(orderId)
      .set(
        {
          ...billingOrderPayload,
          payToken: status.payToken,
          payStatus: status.payStatus,
          confirmingAt: FieldValue.delete(),
        },
        { merge: true }
      ),
    getDb().collection("billing_orders").doc(orderId).set(billingOrderPayload),
  ]);

  return {
    kind: "confirmed",
    orderId,
    type: orderType,
  };
}
