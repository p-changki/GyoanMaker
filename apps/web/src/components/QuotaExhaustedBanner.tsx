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
      {model === "flash" ? "속도" : "정밀"} 모드 생성 횟수를 모두 사용했습니다.{" "}
      <Link href="/account" className="font-bold underline underline-offset-2">
        크레딧 충전
      </Link>{" "}
      또는{" "}
      <Link href="/pricing" className="font-bold underline underline-offset-2">
        요금제 업그레이드
      </Link>
      를 확인하세요.
    </div>
  );
}
