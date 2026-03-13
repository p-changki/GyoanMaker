export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getUsageSummary, estimateCostUsd } from "@gyoanmaker/server-lib/usageLog";

/**
 * GET /api/usage — Get aggregated usage stats
 * Query params:
 *   - period: "daily" | "monthly" (default: "daily")
 *   - email: optional user email filter
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") === "monthly" ? "monthly" : "daily";
  const email = searchParams.get("email") ?? undefined;

  try {
    const summary = await getUsageSummary(period, email);
    const estimatedCost = estimateCostUsd(
      summary.totalInputTokens,
      summary.totalOutputTokens
    );

    return NextResponse.json({
      period,
      email: email ?? "all",
      ...summary,
      estimatedCostUsd: Math.round(estimatedCost * 10000) / 10000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/usage] Failed to get usage summary: ${message}`);
    return NextResponse.json(
      { error: { code: "USAGE_ERROR", message } },
      { status: 500 }
    );
  }
}
