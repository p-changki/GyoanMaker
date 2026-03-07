import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getHandout,
  deleteHandout,
  listHandouts,
  updateHandoutTitle,
} from "@/lib/handouts";
import { setStorageUsed } from "@/lib/quota";

/**
 * GET /api/handouts/[id] — Get handout detail
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const handout = await getHandout(id, session.user.email);
    if (!handout) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(handout);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Get failed: ${message}`);
    return NextResponse.json(
      { error: { code: "GET_ERROR", message: "Failed to fetch handout." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/handouts/[id] — Update handout title
 * Body: { title: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { title } = body as { title?: string };

  if (!title || title.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "title field is required." } },
      { status: 400 }
    );
  }

  try {
    const ok = await updateHandoutTitle(id, session.user.email, title.trim());
    if (!ok) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id, title: title.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Update failed: ${message}`);
    return NextResponse.json(
      { error: { code: "UPDATE_ERROR", message: "Failed to update handout." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/handouts/[id] — Delete handout
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const ok = await deleteHandout(id, session.user.email);
    if (!ok) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }

    const remaining = await listHandouts(session.user.email, 1000);
    await setStorageUsed(session.user.email, remaining.length);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Delete failed: ${message}`);
    return NextResponse.json(
      { error: { code: "DELETE_ERROR", message: "Failed to delete handout." } },
      { status: 500 }
    );
  }
}
