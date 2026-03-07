import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { findHandoutsByInputHash } from "@/lib/handouts";

/**
 * POST /api/handouts/check-duplicate
 * Body: { inputHash: string }
 * Returns: { duplicates: HandoutMeta[] }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    inputHash?: string;
  };

  if (!body.inputHash || typeof body.inputHash !== "string") {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "inputHash is required." } },
      { status: 400 }
    );
  }

  const duplicates = await findHandoutsByInputHash(
    session.user.email,
    body.inputHash
  );

  return NextResponse.json({ duplicates });
}
