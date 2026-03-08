import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import { getSubscription } from "@/lib/subscription";
import {
  type PendingOrder,
  type PlanId,
  PLANS,
  TOP_UP_PACKAGES,
  type TopUpPackageId,
} from "@gyoanmaker/shared/plans";

interface InitCheckoutBody {
  type?: "subscription" | "topup";
  planId?: PlanId;
  packageId?: TopUpPackageId;
}

function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "basic" || value === "standard" || value === "pro";
}

function isTopUpPackageId(value: unknown): value is TopUpPackageId {
  return (
    value === "flash_50" ||
    value === "flash_100" ||
    value === "pro_20" ||
    value === "pro_50" ||
    value === "illu_30" ||
    value === "illu_60" ||
    value === "illu_120"
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

  const body = (await req.json().catch(() => ({}))) as InitCheckoutBody;
  if (body.type !== "subscription" && body.type !== "topup") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Valid type is required. (subscription | topup)",
        },
      },
      { status: 400 }
    );
  }

  let amount = 0;
  let orderName = "";
  let planId: PlanId | undefined;
  let packageId: TopUpPackageId | undefined;

  if (body.type === "subscription") {
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

    const currentPlan = (await getSubscription(email)).tier;
    if (currentPlan === body.planId) {
      return NextResponse.json(
        {
          error: {
            code: "SAME_PLAN",
            message: "You are already on this plan.",
          },
        },
        { status: 400 }
      );
    }

    const currentPrice = PLANS[currentPlan].price;
    const targetPrice = PLANS[body.planId].price;

    if (targetPrice <= currentPrice) {
      return NextResponse.json(
        {
          error: {
            code: "DOWNGRADE_NO_PAYMENT",
            message: "Downgrade does not require payment. Use downgrade API.",
          },
        },
        { status: 400 }
      );
    }

    planId = body.planId;
    amount = targetPrice;
    orderName = `GyoanMaker ${planId.toUpperCase()} Plan`;
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
    amount = selectedPackage.price;
    orderName = `GyoanMaker ${selectedPackage.type.toUpperCase()} ${selectedPackage.amount} Top-up`;
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
  const pendingOrder: PendingOrder = {
    orderId,
    email,
    type: body.type,
    amount,
    orderName,
    status: "pending",
    createdAt,
    refundStatus: "none",
    refundAmount: 0,
    ...(planId ? { planId } : {}),
    ...(packageId ? { packageId } : {}),
  };

  await getDb().collection("pending_orders").doc(orderId).set(pendingOrder);

  return NextResponse.json({
    orderId,
    amount,
    orderName,
  });
}
