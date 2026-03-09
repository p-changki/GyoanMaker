import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * CSRF: Origin 헤더 검증
 * POST/PUT/PATCH/DELETE 요청에 대해 허용된 Origin만 통과시킵니다.
 */
function validateOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }

  const { pathname } = req.nextUrl;

  // Webhook, NextAuth 콜백은 외부 Origin 허용
  const csrfExemptPaths = ["/api/auth", "/api/billing/webhook", "/api/cron"];
  if (csrfExemptPaths.some((p) => pathname.startsWith(p))) {
    return true;
  }

  const origin = req.headers.get("origin");
  if (!origin) {
    return false;
  }

  const allowedOrigins = new Set<string>();
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      allowedOrigins.add(new URL(nextAuthUrl).origin);
    } catch { /* invalid URL — skip */ }
  }
  allowedOrigins.add("http://localhost:3000");

  return allowedOrigins.has(origin);
}


/**
 * 관리자 이메일 목록
 */
function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * 라우트 보호 Proxy
 * Next.js Proxy 런타임에서 실행되므로 Node 전용 모듈을 직접 사용하지 않습니다.
 */
export const middleware = auth((req) => {
  // CSRF Origin 검증
  if (!validateOrigin(req)) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { pathname } = req.nextUrl;

  // 루트 랜딩 페이지는 공개 (startsWith 사용 시 모든 경로 통과 방지)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 공개 경로는 항상 통과
  const publicPaths = [
    "/login",
    "/pending",
    "/pricing",
    "/privacy",
    "/terms",
    "/api/auth",
    "/api/billing/webhook",
    "/api/cron",
    "/_next",
    "/favicon.ico",
    "/icon",
    "/sitemap.xml",
    "/opengraph-image",
  ];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.auth;

  // 미인증 → 로그인 페이지
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin 경로: 관리자만 접근 허용
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const adminEmails = getAdminEmails();
    if (
      !session.user.email ||
      !adminEmails.has(session.user.email.toLowerCase())
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 인증됐지만 미승인 → 승인 대기 페이지
  // Proxy에서는 DB를 직접 조회하지 않고 토큰의 'approved' 플래그를 사용합니다.
  if (!session.user.approved) {
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * 정적 파일(_next/static, _next/image, favicon.ico)을 제외한 모든 요청
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.webp|.*\\.ico).*)",
  ],
};
