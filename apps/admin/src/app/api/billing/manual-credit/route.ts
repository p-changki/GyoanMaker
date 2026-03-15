import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { addTopUpCredits } from "@gyoanmaker/server-lib/subscription";

const VALID_TYPES = new Set(["flash", "pro", "illustration"]);

/**
 * POST /api/billing/manual-credit
 * Manually grants credits to a user.
 *
 * Body:
 *   email: string           — target user email
 *   type: "flash" | "pro" | "illustration"
 *   amount: number          — credit amount to grant
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const adminEmail = session?.user?.email;
  if (!isAdmin(adminEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    type?: string;
    amount?: number;
  };

  const targetEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!targetEmail) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "email is required." } },
      { status: 400 },
    );
  }

  if (!body.type || !VALID_TYPES.has(body.type)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "type must be flash, pro, or illustration.",
        },
      },
      { status: 400 },
    );
  }

  const amount =
    typeof body.amount === "number" && Number.isFinite(body.amount)
      ? Math.floor(body.amount)
      : 0;
  if (amount <= 0) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "amount must be > 0." } },
      { status: 400 },
    );
  }

  const creditType = body.type as "flash" | "pro" | "illustration";
  const orderId = `manual_credit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const credits = await addTopUpCredits(
      targetEmail,
      creditType,
      amount,
      orderId,
    );

    return NextResponse.json({
      ok: true,
      email: targetEmail,
      type: creditType,
      amount,
      orderId,
      credits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/manual-credit] ${message}`);
    return NextResponse.json(
      { error: { code: "GRANT_FAILED", message } },
      { status: 500 },
    );
  }
}
