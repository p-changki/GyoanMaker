"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

interface BillingStatusData {
  subscription?: {
    tier?: "free" | "basic" | "standard" | "pro";
  };
}

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [planTier, setPlanTier] = useState<
    "free" | "basic" | "standard" | "pro" | null
  >(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/billing/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: BillingStatusData | null) => {
        if (
          data?.subscription?.tier === "free" ||
          data?.subscription?.tier === "basic" ||
          data?.subscription?.tier === "standard" ||
          data?.subscription?.tier === "pro"
        ) {
          setPlanTier(data.subscription.tier);
        }
      })
      .catch(() => {});
  }, [status]);

  if (status === "loading") {
    return <div className="w-8 h-8" />;
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <a
        href="/login"
        className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        로그인
      </a>
    );
  }

  const user = session.user;
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    !!user.email && adminEmails.includes(user.email.toLowerCase());
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative z-60" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
        aria-label="사용자 메뉴"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "사용자"}
            width={32}
            height={32}
            className="rounded-full border border-gray-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-xl shadow-gray-200/60 border border-gray-100 z-50 overflow-hidden">
          {/* Profile */}
          <div className="px-4 py-3.5 bg-gray-50/70">
            <div className="flex items-center gap-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "사용자"}
                  width={36}
                  height={36}
                  className="rounded-full border border-gray-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#5E35B1]/10 text-[#5E35B1] flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  {user.email}
                </p>
                {planTier && (
                  <p className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {planTier.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <a
              href="/account"
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>계정</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M5.121 17.804A8.966 8.966 0 0112 15c2.5 0 4.764 1.02 6.379 2.667M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              내 계정
            </a>
            <a
              href="/pricing"
              className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>요금제</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 8c-2.21 0-4 .896-4 2s1.79 2 4 2 4 .896 4 2-1.79 2-4 2m0-12v2m0 12v2"
                />
              </svg>
              요금제
            </a>
            <div className="mx-3 border-t border-gray-100" />
            {isAdmin && (
              <>
                <a
                  href="/admin"
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>관리자</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  사용자 관리
                </a>
                <div className="mx-3 border-t border-gray-100" />
              </>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>로그아웃</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
