"use client";

import { useQuery } from "@tanstack/react-query";

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

function getUsageRatio(data: ModelQuotaView): number {
  if (data.limit <= 0) return 0;
  return data.used / data.limit;
}

export default function QuotaIndicator() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quota"],
    queryFn: fetchQuota,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
        <span>쿼타 확인 중...</span>
      </div>
    );
  }

  if (isError || !data) return null;

  const flashRatio = getUsageRatio(data.flash);
  const proRatio = getUsageRatio(data.pro);
  const isLow = flashRatio >= 0.8 || proRatio >= 0.8;
  const isExhausted =
    !data.canGenerate ||
    (data.flash.remaining <= 0 && data.pro.remaining <= 0);

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
          Flash{" "}
          <strong>
            {data.flash.remaining}/{data.flash.limit}
          </strong>
          회
        </span>
        <span className="text-gray-300">|</span>
        <span>
          Pro{" "}
          <strong>
            {data.pro.remaining}/{data.pro.limit}
          </strong>
          회
        </span>
      </div>
      {isExhausted && <span className="ml-auto text-xs font-bold">한도 초과</span>}
    </div>
  );
}
