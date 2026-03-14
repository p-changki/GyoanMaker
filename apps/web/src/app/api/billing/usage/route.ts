import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserUsageLogs } from "@/lib/usageLog";

const MAX_LIMIT = 50;

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
    const result = await getUserUsageLogs(email, MAX_LIMIT);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/billing/usage] Failed to fetch usage logs: ${message}`);
    return NextResponse.json(
      { error: { code: "USAGE_FETCH_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
