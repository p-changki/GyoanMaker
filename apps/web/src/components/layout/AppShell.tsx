"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

const AUTH_PATHS = ["/login", "/pending"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isFullWidth = pathname === "/compile" || pathname === "/";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fc]">
      <Header />
      {isFullWidth ? (
        <main className="w-full flex-1">{children}</main>
      ) : (
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">
          {children}
        </main>
      )}
      <Footer />
    </div>
  );
}
