import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import "@/lib/types";

/**
 * 미들웨어(Edge Runtime)와 공유할 수 있는 가벼운 NextAuth 설정.
 * Node.js 전용 라이브러리(firebase-admin 등)를 절대 포함하지 않는다.
 *
 * session 콜백에서 JWT 토큰의 approved/userStatus 필드를
 * 세션 객체로 전달해야 미들웨어가 승인 여부를 확인할 수 있다.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.approved = token.approved ?? false;
        session.user.userStatus = token.userStatus ?? "pending";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
