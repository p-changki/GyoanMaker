import NextAuth from "next-auth";
import { authConfig } from "@gyoanmaker/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth: middleware } = NextAuth(authConfig);

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export default middleware(async (req: NextRequest) => {
  const session = (req as unknown as { auth?: { user?: { email?: string } } }).auth;
  const pathname = req.nextUrl.pathname;

  // Allow auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Require authentication
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url));
  }

  // Require admin email
  const adminEmails = getAdminEmails();
  if (!adminEmails.has(session.user.email.toLowerCase())) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
