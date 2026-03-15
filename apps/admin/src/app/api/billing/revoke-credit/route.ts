import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { revokeCredits } from "@gyoanmaker/server-lib/subscription";

const VALID_TYPES = new Set(["flash", "pro", "illustration"]);

/**
 * POST /api/billing/revoke-credit
 * Revoke a specific credit entry by orderId.
 *
 * Body:
 *   email: string
 *   type: "flash" | "pro" | "illustration"
 *   orderId: string
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    type?: string;
    orderId?: string;
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
      { error: { code: "INVALID_BODY", message: "type must be flash, pro, or illustration." } },
      { status: 400 },
    );
  }

  if (!body.orderId || typeof body.orderId !== "string") {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "orderId is required." } },
      { status: 400 },
    );
  }

  try {
    const credits = await revokeCredits(
      targetEmail,
      body.type as "flash" | "pro" | "illustration",
      body.orderId,
    );

    return NextResponse.json({ ok: true, email: targetEmail, credits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/revoke-credit] ${message}`);
    return NextResponse.json(
      { error: { code: "REVOKE_FAILED", message } },
      { status: 500 },
    );
  }
}
