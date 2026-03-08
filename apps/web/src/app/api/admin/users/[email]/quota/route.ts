export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getQuotaStatus, setQuotaLimits } from "@/lib/quota";

/**
 * GET /api/admin/users/[email]/quota — Get user quota status
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
 * PATCH /api/admin/users/[email]/quota — Update user quota limits
 * Body: { flashMonthlyLimit?: number, proMonthlyLimit?: number, storageLimit?: number | null }
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

  const { flashMonthlyLimit, proMonthlyLimit, storageLimit, illustrationMonthlyLimit } = body as {
    flashMonthlyLimit?: number;
    proMonthlyLimit?: number;
    storageLimit?: number | null;
    illustrationMonthlyLimit?: number;
  };

  if (
    flashMonthlyLimit === undefined &&
    proMonthlyLimit === undefined &&
    storageLimit === undefined &&
    illustrationMonthlyLimit === undefined
  ) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message:
            "At least one of flashMonthlyLimit, proMonthlyLimit, storageLimit, illustrationMonthlyLimit is required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    await setQuotaLimits(targetEmail, {
      flashMonthlyLimit,
      proMonthlyLimit,
      storageLimit,
      illustrationMonthlyLimit,
    });
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
