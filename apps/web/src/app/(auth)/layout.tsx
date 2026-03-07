import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | GyoanMaker",
  description: "Sign in to GyoanMaker",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
