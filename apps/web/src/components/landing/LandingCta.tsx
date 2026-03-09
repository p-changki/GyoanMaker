"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function LandingCta() {
  const { status, data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;

  if (status === "loading") {
    return <div className="h-14" />;
  }

  if (status === "authenticated" && user?.approved) {
    return (
      <Link
        href="/generate"
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-blue-200"
      >
        교안 만들기
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Arrow</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </Link>
    );
  }

  if (status === "authenticated" && !user?.approved) {
    return (
      <Link
        href="/pending"
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 text-white text-lg font-bold hover:bg-amber-600 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-amber-200"
      >
        승인 대기 중
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-blue-200"
    >
      시작하기
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <title>Arrow</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      </svg>
    </Link>
  );
}
