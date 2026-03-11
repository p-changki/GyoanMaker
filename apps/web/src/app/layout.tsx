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
    default: "교안메이커 | AI 영어 교안 자동 생성기",
    template: "%s | 교안메이커",
  },
  description:
    "영어 지문을 입력하면 AI가 문장 분석, 핵심 어휘, 요약을 자동 생성합니다. 학원·과외용 PDF 교안을 원클릭으로 제작하세요.",
  keywords: [
    "영어 교안",
    "AI 교안 생성기",
    "영어 지문 분석",
    "영어 학원 교안",
    "영어 핸드아웃",
    "PDF 교안",
    "어휘 분석",
    "영어 수업 자료",
    "English handout generator",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "교안메이커 | AI 영어 교안 자동 생성기",
    description:
      "영어 지문 분석부터 교안 출력까지 한 번에. AI가 문장 분석, 어휘, 요약을 자동 생성합니다.",
    url: SITE_URL,
    siteName: "교안메이커",
    locale: "ko_KR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      "naver-site-verification": "2b2a0d4c4ac004c8dd244d790d7688801ec815f7",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-white" suppressHydrationWarning>
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
