export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { type PlanId } from "@gyoanmaker/shared/plans";
import { changePlan, getSubscription } from "@gyoanmaker/server-lib/subscription";
import { isAdmin } from "@gyoanmaker/server-lib/users";

/**
 * GET /api/users/[email]/subscription — Get user subscription status
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
 * PATCH /api/users/[email]/subscription — Change user plan
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
      { error: { code: "INVALID_BODY", message: "Valid planId is required." } },
      { status: 400 }
    );
  }

  const subscription = await changePlan(targetEmail, body.planId, {
    changedBy: "admin",
    reason: "admin_manual",
  });
  return NextResponse.json({ ok: true, email: targetEmail, subscription });
}
