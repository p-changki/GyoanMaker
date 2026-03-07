import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";

const GA_ID = "G-5C1B8HQXBX";

const SITE_URL = "https://gyoan-maker.store";

export const metadata: Metadata = {
  title: {
    default: "GyoanMaker | AI-Powered English Handout Generator",
    template: "%s | GyoanMaker",
  },
  description:
    "Enter English passages and AI automatically generates sentence analysis, core vocabulary, and summaries. Export as printable PDF.",
  keywords: [
    "English handout",
    "AI handout generator",
    "English passage analysis",
    "academy handout",
    "PDF handout",
    "vocabulary analysis",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "GyoanMaker | AI-Powered English Handout Generator",
    description:
      "From passage analysis to handout export, all in one step. AI generates sentence analysis, vocabulary, and summaries automatically.",
    url: SITE_URL,
    siteName: "GyoanMaker",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AppShell>{children}</AppShell>
              </ConfirmProvider>
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
