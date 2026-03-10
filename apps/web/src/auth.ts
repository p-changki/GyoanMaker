import { headers } from "next/headers";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { findOrCreateUser, getUserStatus } from "@/lib/users";
import { signInLimiter } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Credentials 유저는 Firestore 생성 없이 통과 (임시 계정)
      if (account?.provider === "credentials") return true;

      const hdrs = await headers();
      const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      if (!signInLimiter.check(ip)) {
        return false;
      }

      await findOrCreateUser(user.email, user.name ?? null, user.image ?? null);
      return true;
    },
    async jwt({ token, account, trigger }) {
      // Credentials 유저는 항상 approved (Firestore 조회 불필요)
      if (account?.provider === "credentials") {
        token.approved = true;
        token.userStatus = "approved";
        token.statusCheckedAt = Date.now();
        token.isCredentialUser = true;
        return token;
      }
      if (token.isCredentialUser) {
        token.approved = true;
        token.userStatus = "approved";
        return token;
      }

      // Refresh user status on sign-in, explicit update, or every 5 minutes.
      // Avoids a Firestore read on every authenticated request.
      const STATUS_TTL_MS = 5 * 60 * 1000;
      const isStale =
        !token.statusCheckedAt ||
        Date.now() - (token.statusCheckedAt as number) > STATUS_TTL_MS;
      if (token.email && (trigger === "signIn" || trigger === "update" || isStale)) {
        const status = await getUserStatus(token.email);
        token.approved = status === "approved";
        token.userStatus = status ?? "pending";
        token.statusCheckedAt = Date.now();
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
