export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { type PlanId } from "@gyoanmaker/shared/plans";
import { changePlan, getSubscription } from "@/lib/subscription";
import { isAdmin } from "@/lib/users";

/**
 * GET /api/admin/users/[email]/subscription — 사용자 구독 상태 조회
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
  const subscription = await getSubscription(targetEmail);
  return NextResponse.json({ email: targetEmail, subscription });
}

/**
 * PATCH /api/admin/users/[email]/subscription — 사용자 플랜 변경
 * Body: { planId: "free" | "basic" | "standard" | "pro" }
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
  const body = (await req.json().catch(() => ({}))) as { planId?: PlanId };

  if (
    body.planId !== "free" &&
    body.planId !== "basic" &&
    body.planId !== "standard" &&
    body.planId !== "pro"
  ) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "유효한 planId가 필요합니다." } },
      { status: 400 }
    );
  }

  const subscription = await changePlan(targetEmail, body.planId);
  return NextResponse.json({ ok: true, email: targetEmail, subscription });
}
