import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GyoanMaker Admin",
  description: "GyoanMaker Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background">
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
