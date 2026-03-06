export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getQuotaStatus, setQuotaLimits } from "@/lib/quota";

/**
 * GET /api/admin/users/[email]/quota — 사용자 쿼타 상태 조회
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await params;
  const targetEmail = decodeURIComponent(email);

  try {
    const status = await getQuotaStatus(targetEmail);
    return NextResponse.json({ email: targetEmail, ...status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[admin/quota] Failed to get quota for ${targetEmail}: ${message}`
    );
    return NextResponse.json(
      { error: { code: "QUOTA_ERROR", message } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[email]/quota — 사용자 쿼타 한도 수정
 * Body: { dailyLimit?: number, monthlyLimit?: number }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await params;
  const targetEmail = decodeURIComponent(email);
  const body = await req.json();

  const { dailyLimit, monthlyLimit } = body as {
    dailyLimit?: number;
    monthlyLimit?: number;
  };

  if (dailyLimit === undefined && monthlyLimit === undefined) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "dailyLimit 또는 monthlyLimit 중 하나 이상 필요합니다.",
        },
      },
      { status: 400 }
    );
  }

  try {
    await setQuotaLimits(targetEmail, { dailyLimit, monthlyLimit });
    const updated = await getQuotaStatus(targetEmail);
    return NextResponse.json({ ok: true, email: targetEmail, ...updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[admin/quota] Failed to set quota for ${targetEmail}: ${message}`
    );
    return NextResponse.json(
      { error: { code: "QUOTA_ERROR", message } },
      { status: 500 }
    );
  }
}
