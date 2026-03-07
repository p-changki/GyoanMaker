import { NextRequest, NextResponse } from "next/server";

/**
 * Payment webhook endpoint
 * - Currently in mock payment phase - events are logged but not processed.
 * - Add signature verification + idempotent event handling when integrating Toss.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log("[billing/webhook] mock mode received", {
    type: body?.type ?? "unknown",
    id: body?.id ?? null,
  });

  return NextResponse.json({
    ok: true,
    skipped: true,
    reason: "mock_mode",
  });
}
