import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 | 교안 생성기",
  description: "교안 생성기에 로그인하세요",
};

/**
 * (auth) 라우트 그룹 레이아웃
 * 로그인/승인대기 페이지는 AppShell(헤더) 없이 렌더링
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
