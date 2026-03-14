import { createHash, timingSafeEqual } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { changePlan } from "@/lib/subscription";
import type { PendingOrder } from "@gyoanmaker/shared/plans";

interface WebhookPaymentData {
  orderId?: string;
  paymentKey?: string;
  status?: string;
  totalAmount?: number;
}

interface WebhookPayload {
  eventType?: string;
  id?: string;
  createdAt?: string;
  data?: WebhookPaymentData;
}

function normalizeOrderType(value: unknown): "plan" | "topup" {
  return value === "topup" ? "topup" : "plan";
}

function isValidWebhookAuthHeader(header: string | null): boolean {
  const secret = process.env.TOSS_SECRET_KEY?.trim();
  if (!secret) {
    console.error("[webhook] TOSS_SECRET_KEY is not configured — rejecting request (fail-closed)");
    return false;
  }

  if (!header || !header.startsWith("Basic ")) {
    return false;
  }

  const token = header.replace("Basic ", "").trim();
  const expected = Buffer.from(`${secret}:`).toString("base64");

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (tokenBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(tokenBuf, expectedBuf);
}

function resolveEventId(rawBody: string, payload: WebhookPayload): string {
  if (payload.id && payload.id.length > 0) {
    return payload.id;
  }

  return createHash("sha256").update(rawBody).digest("hex");
}

const CANCEL_STATUSES = new Set(["ABORTED", "EXPIRED", "CANCELED"]);

/**
 * Revert plan/credits for a confirmed order that was canceled/refunded.
 *
 * - plan: downgrade to free
 * - topup: remove credits matching the orderId
 */
async function revertConfirmedOrder(order: PendingOrder) {
  const email = order.email.toLowerCase();
  const orderType = normalizeOrderType((order as { type?: unknown }).type);

  if (orderType === "plan") {
    // Skip revert if a newer plan has been activated since this order
    const userSnap = await getDb().collection("users").doc(email).get();
    const currentPeriodStart = userSnap.data()?.plan?.currentPeriodStartAt;
    const orderConfirmedAt = (order as { confirmedAt?: string }).confirmedAt;

    if (
      typeof currentPeriodStart === "string" &&
      typeof orderConfirmedAt === "string" &&
      new Date(currentPeriodStart).getTime() > new Date(orderConfirmedAt).getTime()
    ) {
      console.warn("[webhook] skipping plan revert — newer plan active", {
        orderId: order.orderId,
        orderConfirmedAt,
        currentPeriodStart,
      });
    } else {
      await changePlan(email, "free");
    }
  }

  if (orderType === "topup" && order.orderId) {
    const userRef = getDb().collection("users").doc(email);
    await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.data() ?? {};
      const credits = data.credits ?? { flash: [], pro: [], illustration: [] };

      // Remove credit entries matching this orderId
      const updatedFlash = (credits.flash ?? []).filter(
        (entry: { orderId?: string }) => entry.orderId !== order.orderId
      );
      const updatedPro = (credits.pro ?? []).filter(
        (entry: { orderId?: string }) => entry.orderId !== order.orderId
      );
      const updatedIllustration = (credits.illustration ?? []).filter(
        (entry: { orderId?: string }) => entry.orderId !== order.orderId
      );

      tx.set(
        userRef,
        {
          credits: {
            flash: updatedFlash,
            pro: updatedPro,
            illustration: updatedIllustration,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  }
}

/**
 * Payment webhook endpoint
 * - Basic auth header validation
 * - PAYMENT_STATUS_CHANGED handling
 * - Idempotent event processing
 * - Plan/credit reversion on cancel/refund
 */
export async function POST(req: NextRequest) {
  if (!isValidWebhookAuthHeader(req.headers.get("authorization"))) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid webhook authorization." } },
      { status: 401 }
    );
  }

  const rawBody = await req.text();
  let payload: WebhookPayload;
  try {
    payload = (JSON.parse(rawBody || "{}") as WebhookPayload) ?? {};
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid webhook payload." } },
      { status: 400 }
    );
  }
  const eventType = payload.eventType ?? "unknown";
  const eventId = resolveEventId(rawBody || "{}", payload);
  const webhookRef = getDb().collection("billing_webhook_events").doc(eventId);

  try {
    await webhookRef.create({
      eventId,
      eventType,
      receivedAt: new Date().toISOString(),
      payload,
    });
  } catch {
    // Document already exists — duplicate event
    return NextResponse.json({
      ok: true,
      duplicate: true,
      eventId,
    });
  }

  if (eventType !== "PAYMENT_STATUS_CHANGED") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "UNSUPPORTED_EVENT_TYPE",
      eventId,
    });
  }

  const orderId = payload.data?.orderId;
  const paymentStatus = payload.data?.status;
  const paymentKey = payload.data?.paymentKey ?? null;

  if (!orderId || !paymentStatus) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "MISSING_ORDER_INFO",
      eventId,
    });
  }

  const orderRef = getDb().collection("pending_orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "ORDER_NOT_FOUND",
      eventId,
    });
  }

  const order = orderSnap.data() as PendingOrder;
  const now = new Date().toISOString();

  if (CANCEL_STATUSES.has(paymentStatus)) {
    await orderRef.set(
      {
        status: "failed",
        paymentKey,
        paymentStatus,
        failedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // If the order was already confirmed (payment went through then refunded),
    // revert the plan/credits that were applied
    if (order.status === "confirmed") {
      try {
        await revertConfirmedOrder(order);
        await orderRef.set(
          { revertedAt: now, revertReason: `Webhook ${paymentStatus}` },
          { merge: true }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown revert error";
        console.error("[webhook] revertConfirmedOrder failed:", { orderId: order.orderId, message });
        await orderRef.set(
          { revertError: message, revertFailedAt: now },
          { merge: true }
        ).catch(() => undefined);
      }
    }
  } else {
    await orderRef.set(
      {
        paymentKey,
        paymentStatus,
        webhookReceivedAt: now,
      },
      { merge: true }
    );
  }

  return NextResponse.json({
    ok: true,
    processed: true,
    eventId,
    eventType,
  });
}
