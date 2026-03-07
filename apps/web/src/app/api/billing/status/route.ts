import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotaStatus } from "@/lib/quota";
import { getSubscriptionExtended } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const [extended, quota] = await Promise.all([
      getSubscriptionExtended(email),
      getQuotaStatus(email),
    ]);

    return NextResponse.json({
      subscription: extended.subscription,
      quota,
      planPendingTier: extended.planPendingTier,
      account: { createdAt: extended.createdAt },
      credits: extended.credits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "BILLING_STATUS_ERROR", message } },
      { status: 500 }
    );
  }
}
