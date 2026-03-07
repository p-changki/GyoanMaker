"use client";

import Link from "next/link";

interface QuotaExhaustedBannerProps {
  model: "flash" | "pro";
}

export default function QuotaExhaustedBanner({
  model,
}: QuotaExhaustedBannerProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      You have used all {model === "flash" ? "Speed" : "Precision"} mode generations.{" "}
      <Link href="/account" className="font-bold underline underline-offset-2">
        Top up
      </Link>{" "}
      or{" "}
      <Link href="/pricing" className="font-bold underline underline-offset-2">
        upgrade your plan
      </Link>
      .
    </div>
  );
}
