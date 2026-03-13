import NextAuth from "next-auth";
import { authConfig } from "@gyoanmaker/auth/config";
import { isAdmin, getUserStatus } from "@gyoanmaker/server-lib/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;
      // Credentials users bypass admin check (dev only)
      if (account?.provider === "credentials") return true;
      // Only admin emails can sign in to the admin app
      return isAdmin(user.email);
    },
    async jwt({ token, account, trigger }) {
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
