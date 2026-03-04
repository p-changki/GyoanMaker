"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const AUTH_PATHS = ["/login", "/pending"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isFullWidth = pathname === "/compile" || pathname === "/";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Header />
      {isFullWidth ? (
        <main className="w-full">{children}</main>
      ) : (
        <main className="mx-auto max-w-[1100px] px-4 py-8">{children}</main>
      )}
    </div>
  );
}
