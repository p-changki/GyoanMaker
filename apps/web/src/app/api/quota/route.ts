import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotaStatus } from "@/lib/quota";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const status = await getQuotaStatus(session.user.email);
    return NextResponse.json({
      plan: status.plan,
      monthKeyKst: status.monthKeyKst,
      flash: {
        limit: status.flash.limit,
        used: status.flash.used,
        remaining: status.flash.remaining,
        credits: status.flash.credits,
      },
      pro: {
        limit: status.pro.limit,
        used: status.pro.used,
        remaining: status.pro.remaining,
        credits: status.pro.credits,
      },
      storage: {
        limit: status.storage.limit,
        used: status.storage.used,
        remaining: status.storage.remaining,
      },
      illustration: {
        limit: status.illustration.limit,
        used: status.illustration.used,
        remaining: status.illustration.remaining,
        credits: status.illustration.credits,
      },
      canGenerate: status.canGenerate,
      canGenerateByModel: status.canGenerateByModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/quota] Failed to get quota: ${message}`);
    return NextResponse.json(
      { error: { code: "QUOTA_ERROR", message: "Failed to fetch quota." } },
      { status: 500 }
    );
  }
}
