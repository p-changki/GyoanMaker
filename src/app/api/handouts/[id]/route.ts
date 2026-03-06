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
 * GET /api/handouts/[id] — 교안 상세 조회
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const handout = await getHandout(id, session.user.email);
    if (!handout) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "교안을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }
    return NextResponse.json(handout);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Get failed: ${message}`);
    return NextResponse.json(
      { error: { code: "GET_ERROR", message: "교안 조회에 실패했습니다." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/handouts/[id] — 교안 제목 수정
 * Body: { title: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { title } = body as { title?: string };

  if (!title || title.trim().length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "title 필드가 필요합니다." } },
      { status: 400 }
    );
  }

  try {
    const ok = await updateHandoutTitle(id, session.user.email, title.trim());
    if (!ok) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "교안을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id, title: title.trim() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Update failed: ${message}`);
    return NextResponse.json(
      { error: { code: "UPDATE_ERROR", message: "교안 수정에 실패했습니다." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/handouts/[id] — 교안 삭제
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const ok = await deleteHandout(id, session.user.email);
    if (!ok) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "교안을 찾을 수 없습니다." } },
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
      { error: { code: "DELETE_ERROR", message: "교안 삭제에 실패했습니다." } },
      { status: 500 }
    );
  }
}
