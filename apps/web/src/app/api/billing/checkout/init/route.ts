import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import { createTossPayment, TossPaymentError } from "@/lib/payment";
import { billingCheckoutInitLimiter } from "@/lib/rate-limit";
import {
  type CheckoutFlow,
  type PendingOrder,
  type PlanId,
  PLANS,
  TOP_UP_PACKAGES,
  type TopUpPackageId,
  toVatInclusiveAmount,
} from "@gyoanmaker/shared/plans";

interface InitCheckoutBody {
  type?: "plan" | "topup";
  planId?: PlanId;
  packageId?: TopUpPackageId;
  checkoutFlow?: CheckoutFlow;
}

function isCheckoutFlow(value: unknown): value is CheckoutFlow {
  return value === "widget" || value === "paylink";
}

function resolveCheckoutFlow(requested: unknown): CheckoutFlow {
  if (isCheckoutFlow(requested)) {
    return requested;
  }

  const raw = process.env.TOSS_CHECKOUT_FLOW?.trim().toLowerCase();
  return raw === "paylink" ? "paylink" : "widget";
}

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function resolveAppOrigin(req: NextRequest): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) {
    return null;
  }

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function resolvePaylinkResultCallback(origin: string): string {
  const configured = process.env.TOSS_PAYLINK_RESULT_CALLBACK_URL?.trim();
  if (configured) {
    return configured;
  }

  return `${origin}/api/billing/paylink/callback`;
}

function isLocalOrigin(origin: string): boolean {
  return (
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.includes("://localhost") ||
    origin.includes("://127.0.0.1")
  );
}

function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "basic" || value === "standard" || value === "pro";
}

function isTopUpPackageId(value: unknown): value is TopUpPackageId {
  return (
    value === "illu_20" ||
    value === "illu_50" ||
    value === "illu_100" ||
    value === "pro_20" ||
    value === "pro_60" ||
    value === "flash_100"
  );
}

function createOrderId(): string {
  return `ord_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
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

  if (!billingCheckoutInitLimiter.check(email)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
      { status: 429 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as InitCheckoutBody;
  if (body.type !== "plan" && body.type !== "topup") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Valid type is required. (plan | topup)",
        },
      },
      { status: 400 }
    );
  }

  let amount = 0;
  let supplyAmount = 0;
  let vatAmount = 0;
  let orderName = "";
  let planId: PlanId | undefined;
  let packageId: TopUpPackageId | undefined;

  if (body.type === "plan") {
    if (!isPlanId(body.planId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PLAN", message: "Valid planId is required." } },
        { status: 400 }
      );
    }

    if (body.planId === "free") {
      return NextResponse.json(
        {
          error: {
            code: "FREE_PLAN_NOT_PAYABLE",
            message: "Free plan does not require payment.",
          },
        },
        { status: 400 }
      );
    }

    planId = body.planId;
    const vatBreakdown = toVatInclusiveAmount(PLANS[planId].price);
    supplyAmount = vatBreakdown.supplyAmount;
    vatAmount = vatBreakdown.vatAmount;
    amount = vatBreakdown.totalAmount;
    orderName = `GyoanMaker ${planId.toUpperCase()} 이용권`;
  }

  if (body.type === "topup") {
    if (!isTopUpPackageId(body.packageId)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PACKAGE",
            message: "Valid packageId is required.",
          },
        },
        { status: 400 }
      );
    }

    const selectedPackage = TOP_UP_PACKAGES.find((pkg) => pkg.id === body.packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        {
          error: {
            code: "PACKAGE_NOT_FOUND",
            message: "Top-up package not found.",
          },
        },
        { status: 404 }
      );
    }

    packageId = selectedPackage.id;
    const vatBreakdown = toVatInclusiveAmount(selectedPackage.price);
    supplyAmount = vatBreakdown.supplyAmount;
    vatAmount = vatBreakdown.vatAmount;
    amount = vatBreakdown.totalAmount;
    orderName = `GyoanMaker ${selectedPackage.label}`;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_AMOUNT",
          message: "Amount must be greater than zero.",
        },
      },
      { status: 400 }
    );
  }

  const orderId = createOrderId();
  const createdAt = new Date().toISOString();
  const checkoutFlow = resolveCheckoutFlow(body.checkoutFlow);
  const pendingOrder: PendingOrder = {
    orderId,
    email,
    type: body.type,
    supplyAmount,
    vatAmount,
    amount,
    orderName,
    status: "pending",
    createdAt,
    checkoutFlow,
    refundStatus: "none",
    refundAmount: 0,
    ...(planId ? { planId } : {}),
    ...(packageId ? { packageId } : {}),
  };

  const pendingOrderRef = getDb().collection("pending_orders").doc(orderId);
  await pendingOrderRef.set(pendingOrder);

  if (checkoutFlow === "paylink") {
    const origin = resolveAppOrigin(req);
    if (!origin) {
      await pendingOrderRef.set(
        {
          status: "failed",
          failedAt: new Date().toISOString(),
          errorMessage: "APP_ORIGIN_MISSING",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json(
        {
          error: {
            code: "APP_ORIGIN_MISSING",
            message: "App origin is not configured for paylink checkout.",
          },
        },
        { status: 500 }
      );
    }

    if (!process.env.TOSS_PAYLINK_API_KEY?.trim()) {
      await pendingOrderRef.set(
        {
          status: "failed",
          failedAt: new Date().toISOString(),
          errorMessage: "PAYLINK_API_KEY_MISSING",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json(
        {
          error: {
            code: "PAYLINK_API_KEY_MISSING",
            message: "TOSS_PAYLINK_API_KEY is required for paylink checkout.",
          },
        },
        { status: 500 }
      );
    }

    if (isLocalOrigin(origin)) {
      await pendingOrderRef.set(
        {
          status: "failed",
          failedAt: new Date().toISOString(),
          errorMessage: "PAYLINK_PUBLIC_URL_REQUIRED",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json(
        {
          error: {
            code: "PAYLINK_PUBLIC_URL_REQUIRED",
            message:
              "Paylink requires a public domain URL. Set NEXT_PUBLIC_APP_URL to your deployed HTTPS domain.",
          },
        },
        { status: 400 }
      );
    }

    try {
      const createdPayment = await createTossPayment({
        orderNo: orderId,
        amount,
        amountTaxFree: 0,
        productDesc: orderName.slice(0, 255),
        retUrl: `${origin}/billing/success`,
        retCancelUrl: `${origin}/billing/fail`,
        autoExecute: true,
        resultCallback: resolvePaylinkResultCallback(origin),
      });

      await pendingOrderRef.set(
        {
          checkoutUrl: createdPayment.checkoutUrl,
          payToken: createdPayment.payToken,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return NextResponse.json({
        orderId,
        supplyAmount,
        vatAmount,
        amount,
        orderName,
        checkoutFlow,
        checkoutUrl: createdPayment.checkoutUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await pendingOrderRef.set(
        {
          status: "failed",
          failedAt: new Date().toISOString(),
          errorMessage: message,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (error instanceof TossPaymentError) {
        return NextResponse.json(
          {
            error: {
              code: error.code ?? "PAYLINK_CREATE_FAILED",
              message: error.message || "Failed to create Toss paylink checkout.",
            },
          },
          { status: error.statusCode ?? 502 }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: "PAYLINK_CREATE_FAILED",
            message: "Failed to create Toss paylink checkout.",
          },
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    orderId,
    supplyAmount,
    vatAmount,
    amount,
    orderName,
    checkoutFlow,
  });
}
