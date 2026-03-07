import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { changePlan, getSubscription } from "@/lib/subscription";
import { type PlanId, PLANS } from "@gyoanmaker/shared/plans";

interface DowngradeBody {
  planId?: PlanId;
}

function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "basic" || value === "standard" || value === "pro";
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

  const body = (await req.json().catch(() => ({}))) as DowngradeBody;
  if (!isPlanId(body.planId)) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Valid planId is required." } },
      { status: 400 }
    );
  }

  const current = await getSubscription(email);
  if (PLANS[body.planId].price > PLANS[current.tier].price) {
    return NextResponse.json(
      {
        error: {
          code: "UPGRADE_REQUIRES_PAYMENT",
          message: "Upgrades require payment flow.",
        },
      },
      { status: 400 }
    );
  }

  const subscription = await changePlan(email, body.planId, {
    forceImmediate: true,
    paymentMethod: body.planId === "free" ? null : current.paymentMethod,
  });

  return NextResponse.json({
    ok: true,
    subscription,
  });
}
