import { headers } from "next/headers";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { findOrCreateUser, getUserStatus } from "@/lib/users";
import { signInLimiter } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;

      const hdrs = await headers();
      const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      if (!signInLimiter.check(ip)) {
        return false;
      }

      await findOrCreateUser(user.email, user.name ?? null, user.image ?? null);
      return true;
    },
    async jwt({ token }) {
      // 매 요청마다 DB에서 최신 상태를 조회 (signIn, update 뿐 아니라 항상)
      if (token.email) {
        const status = await getUserStatus(token.email);
        token.approved = status === "approved";
        token.userStatus = status ?? "pending";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.approved = token.approved ?? false;
        session.user.userStatus = token.userStatus ?? "pending";
      }
      return session;
    },
  },
});
