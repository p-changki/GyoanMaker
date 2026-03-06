"use client";

import { useState } from "react";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

const AUTH_LINKS = [
  { href: "/generate", label: "생성" },
  { href: "/dashboard", label: "내 교안" },
  { href: "/pricing", label: "요금제" },
] as const;

export interface HeaderUser {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface HeaderClientProps {
  isAuth: boolean;
  user: HeaderUser | null;
}

export default function HeaderClient({ isAuth, user }: HeaderClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = isAuth ? AUTH_LINKS : [];

  return (
    <header className="relative z-60 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-[1100px] px-4 flex items-center justify-between h-20 md:h-28">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="교안 생성기"
            className="h-12 w-auto md:h-[90px]"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-base font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop user menu */}
        <div className="hidden md:block">
          <UserMenu user={user} />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-3 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-gray-100">
            <UserMenu user={user} />
          </div>
        </div>
      )}
    </header>
  );
}
