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
    async jwt({ token, trigger }) {
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
