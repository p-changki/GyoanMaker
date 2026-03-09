import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPost, listPosts } from "@/lib/board/posts";
import { isAdmin } from "@/lib/users";
import type { PostType } from "@/lib/board/types";

/**
 * GET /api/board — List posts (content excluded)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const posts = await listPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/board] List failed: ${message}`);
    return NextResponse.json(
      { error: { code: "LIST_ERROR", message: "Failed to fetch posts." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/board — Create post
 * Body: { type, title, content, password? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { type, title, content, password, replyEmail } = body as {
      type?: PostType;
      title?: string;
      content?: string;
      password?: string;
      replyEmail?: string;
    };

    // Validate type
    if (!type || !["notice", "secret"].includes(type)) {
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: "type must be 'notice' or 'secret'." } },
        { status: 400 }
      );
    }

    // Notice requires admin
    if (type === "notice" && !isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only admins can create notices." } },
        { status: 403 }
      );
    }

    // Validate title
    if (!title || title.trim().length === 0 || title.trim().length > 100) {
      return NextResponse.json(
        { error: { code: "INVALID_TITLE", message: "Title is required (max 100 chars)." } },
        { status: 400 }
      );
    }

    // Validate content
    if (!content || content.trim().length === 0 || content.length > 5000) {
      return NextResponse.json(
        { error: { code: "INVALID_CONTENT", message: "Content is required (max 5000 chars)." } },
        { status: 400 }
      );
    }

    // Secret posts require 4-digit password
    if (type === "secret") {
      if (!password || !/^\d{4}$/.test(password)) {
        return NextResponse.json(
          { error: { code: "INVALID_PASSWORD", message: "Secret posts require a 4-digit password." } },
          { status: 400 }
        );
      }
    }

    const post = await createPost({
      type,
      title: title.trim(),
      content: content.trim(),
      authorEmail: session.user.email,
      authorName: session.user.name ?? null,
      replyEmail: type === "secret" && replyEmail ? replyEmail.trim() : undefined,
      password: type === "secret" ? password : undefined,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/board] Create failed: ${message}`);
    return NextResponse.json(
      { error: { code: "CREATE_ERROR", message: "Failed to create post." } },
      { status: 500 }
    );
  }
}
