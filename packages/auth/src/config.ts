import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/**
 * Edge-safe NextAuth configuration shared between apps.
 * Must NOT import Node.js-only modules (e.g., firebase-admin).
 *
 * The session callback propagates JWT approved/userStatus fields
 * to the session object so middleware can enforce auth.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "\uc774\uba54\uc77c", type: "email" },
        password: { label: "\ube44\ubc00\ubc88\ud638", type: "password" },
      },
      async authorize(credentials) {
        const { timingSafeEqual } = await import("crypto");
        const raw = process.env.TEMP_ACCOUNTS ?? "";
        const pairs = raw.split(",").map((s) => s.trim()).filter(Boolean);
        for (const pair of pairs) {
          const colonIdx = pair.indexOf(":");
          if (colonIdx === -1) continue;
          const email = pair.slice(0, colonIdx).trim();
          const password = pair.slice(colonIdx + 1).trim();
          const input = String(credentials?.password ?? "");
          if (
            credentials?.email === email &&
            input.length === password.length &&
            timingSafeEqual(Buffer.from(input), Buffer.from(password))
          ) {
            return { id: email, email, name: email.split("@")[0] };
          }
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
