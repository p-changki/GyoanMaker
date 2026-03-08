import { auth } from "@/auth";
import HeaderClient from "./HeaderClient";
import type { HeaderUser } from "./HeaderClient";
import { isAdmin } from "@/lib/users";

export default async function HeaderServer() {
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
