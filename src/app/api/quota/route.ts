import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotaStatus } from "@/lib/quota";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  try {
    const status = await getQuotaStatus(session.user.email);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/quota] Failed to get quota: ${message}`);
    return NextResponse.json(
      { error: { code: "QUOTA_ERROR", message: "쿼타 조회에 실패했습니다." } },
      { status: 500 }
    );
  }
}
