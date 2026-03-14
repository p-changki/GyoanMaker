import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPost } from "@/lib/board/posts";
import { verifyPassword } from "@/lib/board/password";

// Per-IP rate limit: 5 attempts per minute
const VERIFY_RATE_LIMIT_WINDOW_MS = 60_000;
const VERIFY_RATE_LIMIT_MAX = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const verifyRateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor?.trim()) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim()).filter(Boolean);
    return ips[ips.length - 1] ?? "unknown";
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}

function enforceVerifyRateLimit(req: NextRequest, postId: string): number | null {
  const now = Date.now();
  const key = `${getClientIp(req)}:${postId}`;
  const current = verifyRateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    verifyRateLimitStore.set(key, { count: 1, resetAt: now + VERIFY_RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (current.count >= VERIFY_RATE_LIMIT_MAX) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;

  if (verifyRateLimitStore.size > 5_000) {
    for (const [k, entry] of verifyRateLimitStore) {
      if (entry.resetAt <= now) verifyRateLimitStore.delete(k);
    }
  }

  return null;
}

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

  const retryAfter = enforceVerifyRateLimit(req, id);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many attempts. Please retry later." } },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

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
