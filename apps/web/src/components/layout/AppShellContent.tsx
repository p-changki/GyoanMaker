"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/pending"];

interface AppShellContentProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShellContent({
  header,
  footer,
  children,
}: AppShellContentProps) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isFullWidth = pathname === "/compile" || pathname === "/";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fc]">
      {header}
      {isFullWidth ? (
        <main className="w-full flex-1">{children}</main>
      ) : (
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">
          {children}
        </main>
      )}
      {footer}
    </div>
  );
}
