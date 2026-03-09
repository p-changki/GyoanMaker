import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPost, deletePost } from "@/lib/board/posts";
import { isAdmin } from "@/lib/users";

/**
 * GET /api/board/[id] — Get post detail
 * Secret posts: author/admin see content; others get locked response
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
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Post not found." } },
        { status: 404 }
      );
    }

    const email = session.user.email.toLowerCase();
    const isAuthor = post.authorEmail === email;
    const isAdminUser = isAdmin(email);

    // Secret post: admin sees content directly; others must verify password
    if (post.type === "secret") {
      if (isAdminUser) {
        const { passwordHash, ...detail } = post;
        void passwordHash;
        return NextResponse.json(detail);
      }
      const { passwordHash, ...meta } = post;
      void passwordHash;
      return NextResponse.json({
        ...meta,
        content: null,
        locked: true,
        canDelete: isAuthor,
      });
    }

    // Notice: return full content (strip passwordHash from response)
    const { passwordHash, ...detail } = post;
    void passwordHash;
    return NextResponse.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/board/${id}] Get failed: ${message}`);
    return NextResponse.json(
      { error: { code: "GET_ERROR", message: "Failed to fetch post." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/board/[id] — Delete post (author or admin only)
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
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Post not found." } },
        { status: 404 }
      );
    }

    const email = session.user.email.toLowerCase();
    const isAuthor = post.authorEmail === email;
    const isAdminUser = isAdmin(email);

    if (!isAuthor && !isAdminUser) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only delete your own posts." } },
        { status: 403 }
      );
    }

    await deletePost(id);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/board/${id}] Delete failed: ${message}`);
    return NextResponse.json(
      { error: { code: "DELETE_ERROR", message: "Failed to delete post." } },
      { status: 500 }
    );
  }
}
