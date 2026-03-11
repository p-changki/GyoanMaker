import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPocketVoca, deletePocketVoca } from "@/lib/pocketVocas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const item = await getPocketVoca(id, email);
    if (!item) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pocket voca not found." } }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error("[api/pocket-vocas/[id]] GET error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to load pocket voca." } }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await deletePocketVoca(id, email);
    if (!deleted) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Pocket voca not found." } }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/pocket-vocas/[id]] DELETE error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete pocket voca." } }, { status: 500 });
  }
}
