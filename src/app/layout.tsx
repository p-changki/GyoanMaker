import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "교안 생성기",
  description: "AI 기반 맞춤형 교육 자료 제작 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
