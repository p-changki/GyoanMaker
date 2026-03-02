"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = pathname === "/compile";

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
