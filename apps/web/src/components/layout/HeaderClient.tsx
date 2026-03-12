"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import UserMenu from "@/components/UserMenu";

const PUBLIC_LINKS = [
  {
    href: "/",
    label: "홈",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/about",
    label: "기능",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    href: "/pricing",
    label: "요금제",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
] as const;

const AUTH_LINKS = [
  {
    href: "/",
    label: "홈",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/board",
    label: "게시판",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    href: "/generate",
    label: "생성",
    icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  },
  {
    href: "/dashboard",
    label: "교안",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    href: "/voca-test",
    label: "보카테스트",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/pocket-voca",
    label: "포켓보카",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    href: "/illustrations/concept",
    label: "일러스트",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    href: "/pricing",
    label: "요금제",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
] as const;

export interface HeaderUser {
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
}

interface HeaderClientProps {
  isAuth: boolean;
  user: HeaderUser | null;
}

export default function HeaderClient({ isAuth, user }: HeaderClientProps) {
  const pathname = usePathname();
  const navLinks = isAuth ? AUTH_LINKS : PUBLIC_LINKS;
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);


  const activeTab =
    navLinks.find((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
    )?.label ?? navLinks[0].label;

  const navPill = (
    <div className="flex items-center gap-0.5 rounded-full border border-gray-200/80 bg-white/95 px-1 py-1 shadow-md sm:gap-1 lg:gap-1.5">
      {navLinks.map((item) => {
        const isActive = activeTab === item.label;

        return (
          <Link
            key={item.label}
            href={item.href}
            prefetch={false}
            className={cn(
              "relative cursor-pointer whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold transition-colors lg:px-5 lg:text-sm",
              "text-gray-500 hover:text-gray-900",
              isActive && "text-gray-900"
            )}
          >
            {/* Mobile: icon only / Desktop: text only */}
            <span className="hidden md:inline">{item.label}</span>
            <span className="md:hidden">
              <svg
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <title>{item.label}</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.icon}
                />
              </svg>
            </span>
            {isActive && (
              <motion.div
                layoutId="nav-lamp"
                className="absolute inset-0 -z-10 w-full rounded-full bg-gray-100"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-blue-600" />
              </motion.div>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Header: Logo + inline nav (md+) + UserMenu */}
      <header className="relative z-50 bg-transparent">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:h-20 sm:px-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="GyoanMaker"
              className="h-14 w-auto sm:h-20"
            />
          </Link>

          {/* Desktop inline nav pill — absolute center so it stays centered regardless of logo/menu width */}
          {mounted && (
            <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
              {navPill}
            </div>
          )}

          {/* Right: CTA or UserMenu */}
          <div className="flex items-center gap-4">
            {isAuth ? (
              <UserMenu user={user} />
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-gray-900 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
              >
                시작하기
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom floating nav */}
      {mounted && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden">
          {navPill}
        </div>
      )}
    </>
  );
}
