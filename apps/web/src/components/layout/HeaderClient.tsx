"use client";


import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import UserMenu from "@/components/UserMenu";

const PUBLIC_LINKS = [
  {
    href: "/",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/about",
    label: "Features",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
] as const;

const AUTH_LINKS = [
  {
    href: "/",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/generate",
    label: "Generate",
    icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    href: "/pricing",
    label: "Pricing",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
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
  const pathname = usePathname();
  const navLinks = isAuth ? AUTH_LINKS : PUBLIC_LINKS;
  


  const activeTab =
    navLinks.find((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
    )?.label ?? navLinks[0].label;

  return (
    <>
      {/* Top bar: Logo + UserMenu/CTA */}
      <header className="relative z-50 bg-transparent">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 sm:h-20">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="GyoanMaker"
              className="h-14 w-auto sm:h-20"
            />
          </Link>

          {/* Desktop right: CTA or UserMenu */}
          <div className="flex items-center gap-4">
            {isAuth ? (
              <UserMenu user={user} />
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-gray-900 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-900 hover:text-white"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating pill nav */}
      <div
        className={cn(
          "fixed left-1/2 z-50 -translate-x-1/2",
          "bottom-6 sm:bottom-auto sm:top-0 sm:pt-6"
        )}
      >
        <div className="flex items-center gap-1 rounded-full border border-gray-200/50 bg-white/80 px-1 py-1 shadow-lg backdrop-blur-lg sm:gap-2">
          {navLinks.map((item) => {
            const isActive = activeTab === item.label;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-6",
                  "text-gray-500 hover:text-gray-900",
                  isActive && "text-gray-900"
                )}
              >
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
                    <div className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-blue-600">
                      <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-blue-500/20 blur-md" />
                      <div className="absolute -top-1 h-6 w-8 rounded-full bg-blue-500/20 blur-md" />
                      <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-blue-500/20 blur-sm" />
                    </div>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
