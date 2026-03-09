import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPost } from "@/lib/board/posts";
import { verifyPassword } from "@/lib/board/password";

/**
 * POST /api/board/[id]/verify — Verify secret post password
 * Body: { password: string }
 * Success: { verified: true, content: string }
 * Failure: { verified: false }
 */
export async function POST(
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

  try {
    const body = await req.json();
    const { password } = body as { password?: string };

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Password is required." } },
        { status: 400 }
      );
    }

    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Post not found." } },
        { status: 404 }
      );
    }

    if (post.type !== "secret" || !post.passwordHash) {
      return NextResponse.json(
        { error: { code: "NOT_SECRET", message: "This post is not password-protected." } },
        { status: 400 }
      );
    }

    const ok = await verifyPassword(password, post.passwordHash);
    if (!ok) {
      return NextResponse.json({ verified: false }, { status: 200 });
    }

    return NextResponse.json({
      verified: true,
      content: post.content,
      replyEmail: post.replyEmail ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/board/${id}/verify] Verify failed: ${message}`);
    return NextResponse.json(
      { error: { code: "VERIFY_ERROR", message: "Failed to verify password." } },
      { status: 500 }
    );
  }
}
