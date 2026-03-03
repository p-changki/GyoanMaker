import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

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
 * 라우트 보호 미들웨어
 * Edge Runtime 환경이므로 가벼운 auth 설정을 사용합니다.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 공개 경로는 항상 통과
  const publicPaths = [
    "/login",
    "/pending",
    "/api/auth",
    "/_next",
    "/favicon.ico",
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
    if (!session.user.email || !adminEmails.has(session.user.email.toLowerCase())) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 인증됐지만 미승인 → 승인 대기 페이지
  // 주의: Edge Runtime이므로 DB를 직접 조회하지 않고 토큰에 담긴 'approved' 플래그를 확인합니다.
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
