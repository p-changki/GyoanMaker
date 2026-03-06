import { NextRequest, NextResponse } from "next/server";

/**
 * 결제 웹훅 엔드포인트
 * - 현재는 Mock 결제 단계이므로 이벤트를 기록만 하고 처리하지 않습니다.
 * - Toss 연동 시 서명 검증 + 이벤트 멱등 처리 로직을 여기에 추가합니다.
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
