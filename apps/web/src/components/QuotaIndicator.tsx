"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface ModelQuotaView {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
}

interface QuotaStatusResponse {
  plan: "free" | "basic" | "standard" | "pro";
  flash: ModelQuotaView;
  pro: ModelQuotaView;
  storage: {
    limit: number | null;
    used: number;
    remaining: number | null;
  };
  canGenerate: boolean;
}

async function fetchQuota(): Promise<QuotaStatusResponse> {
  const res = await fetch("/api/quota");
  if (!res.ok) throw new Error("Failed to fetch quota");
  return res.json();
}

function formatQuota(data: ModelQuotaView): string {
  const effectiveTotal = data.limit + data.credits;
  return `${data.remaining}/${effectiveTotal}`;
}

export default function QuotaIndicator() {
  const { status } = useSession();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quota"],
    queryFn: fetchQuota,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: status === "authenticated",
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
        <span>잔여 사용량 확인 중...</span>
      </div>
    );
  }

  if (isError || !data) return null;

  const flashTotal = data.flash.limit + data.flash.credits;
  const proTotal = data.pro.limit + data.pro.credits;
  const isLow =
    (flashTotal > 0 && data.flash.remaining / flashTotal <= 0.2) ||
    (proTotal > 0 && data.pro.remaining / proTotal <= 0.2);
  const isExhausted =
    !data.canGenerate || (data.flash.remaining <= 0 && data.pro.remaining <= 0);

  return (
    <div
      className={`flex items-center gap-3 text-sm px-4 py-2.5 rounded-xl border ${
        isExhausted
          ? "bg-red-50 border-red-200 text-red-700"
          : isLow
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-gray-50 border-gray-200 text-gray-600"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${
          isExhausted ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />
      <div className="flex items-center gap-3">
        <span>
          속도{" "}
          <strong>{formatQuota(data.flash)}</strong>
        </span>
        <span className="text-gray-300">|</span>
        <span>
          정밀{" "}
          <strong>{formatQuota(data.pro)}</strong>
        </span>
      </div>
      {isExhausted && (
        <span className="ml-auto text-xs font-bold">사용량 초과</span>
      )}
    </div>
  );
}
