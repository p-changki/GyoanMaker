import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyPaylinkOrder } from "@/lib/paylink-confirm";
import { TossPaymentError } from "@/lib/payment";

interface ConfirmPaylinkBody {
  orderId?: string;
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

  const body = (await req.json().catch(() => ({}))) as ConfirmPaylinkBody;
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  if (!orderId) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "orderId is required." } },
      { status: 400 }
    );
  }

  try {
    const result = await applyPaylinkOrder(orderId, { assertEmail: email });

    if (result.kind === "confirmed") {
      return NextResponse.json({ ok: true, orderId, type: result.type });
    }

    if (result.kind === "already_confirmed") {
      return NextResponse.json({ ok: true, orderId, alreadyConfirmed: true });
    }

    if (result.kind === "not_found") {
      return NextResponse.json(
        { error: { code: "ORDER_NOT_FOUND", message: "Pending order not found." } },
        { status: 404 }
      );
    }

    if (result.kind === "forbidden") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this order." } },
        { status: 403 }
      );
    }

    if (result.kind === "already_failed") {
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

    if (result.kind === "in_progress") {
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

    if (result.kind === "not_completed") {
      return NextResponse.json(
        {
          error: {
            code: "PAYMENT_NOT_COMPLETED",
            message: `Paylink status is ${result.payStatus}.`,
          },
        },
        { status: 409 }
      );
    }

    if (result.kind === "amount_mismatch") {
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

    return NextResponse.json(
      { error: { code: "UNKNOWN_RESULT", message: "Unknown confirm result." } },
      { status: 500 }
    );
  } catch (error) {
    if (error instanceof TossPaymentError) {
      return NextResponse.json(
        {
          error: {
            code: error.code ?? "PAYLINK_CONFIRM_ERROR",
            message: "Paylink confirmation failed. Please try again.",
          },
        },
        { status: error.statusCode ?? 502 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/billing/paylink/confirm] Failed: ${message}`);
    return NextResponse.json(
      {
        error: {
          code: "PAYLINK_CONFIRM_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
