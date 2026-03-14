import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotaStatus } from "@/lib/quota";
import { countIllustrationSamples } from "@/lib/illustration-samples";
import { expirePlanIfNeeded, getSubscriptionExtended } from "@/lib/subscription";
import { getDb } from "@/lib/firebase-admin";
import { type PlanId, PLANS } from "@gyoanmaker/shared/plans";

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
    // Lazy expiry: downgrade if plan has expired
    await expirePlanIfNeeded(email);

    const [extended, quota, sampleCount] = await Promise.all([
      getSubscriptionExtended(email),
      getQuotaStatus(email),
      countIllustrationSamples(email),
    ]);

    // Daily style test usage
    const userDoc = await getDb().collection("users").doc(email.toLowerCase()).get();
    const userData = userDoc.data() as Record<string, unknown> | undefined;
    const sampleUsage = userData?.illustrationSampleUsage as
      | { dateKey?: string; count?: number }
      | undefined;
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayKst = formatter.format(new Date());
    const planTier = (extended.subscription.tier as PlanId) || "free";
    const dailyLimit = PLANS[planTier].dailySampleLimit;
    const dailyUsed =
      sampleUsage?.dateKey === todayKst && typeof sampleUsage?.count === "number"
        ? sampleUsage.count
        : 0;

    return NextResponse.json({
      subscription: extended.subscription,
      quota,
      account: { createdAt: extended.createdAt },
      credits: extended.credits,
      illustrationSamples: { count: sampleCount },
      dailySampleUsage: { used: dailyUsed, limit: dailyLimit },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/billing/status] Failed to fetch billing status: ${message}`);
    return NextResponse.json(
      { error: { code: "BILLING_STATUS_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
