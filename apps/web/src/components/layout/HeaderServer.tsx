import { cookies } from "next/headers";
import { auth } from "@/auth";
import HeaderClient from "./HeaderClient";
import type { HeaderUser } from "./HeaderClient";
import { isAdmin } from "@/lib/users";

export default async function HeaderServer() {
  // Skip auth() + Firestore read when no session cookie exists.
  // This eliminates ~1s TTFB on public pages for unauthenticated visitors.
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.has("authjs.session-token") ||
    cookieStore.has("__Secure-authjs.session-token");

  if (!hasSession) {
    return <HeaderClient isAuth={false} user={null} />;
  }

  const session = await auth();
  const isAuth = !!session?.user;
  const user: HeaderUser | null = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        isAdmin: isAdmin(session.user.email),
      }
    : null;

  return <HeaderClient isAuth={isAuth} user={user} />;
}
