"use client";

import { useQuery } from "@tanstack/react-query";

interface QuotaStatusResponse {
  limits: { dailyLimit: number; monthlyLimit: number };
  daily: { count: number; key: string };
  monthly: { count: number; key: string };
  canGenerate: boolean;
}

async function fetchQuota(): Promise<QuotaStatusResponse> {
  const res = await fetch("/api/quota");
  if (!res.ok) throw new Error("Failed to fetch quota");
  return res.json();
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

  const dailyRemaining = Math.max(0, data.limits.dailyLimit - data.daily.count);
  const monthlyRemaining = Math.max(
    0,
    data.limits.monthlyLimit - data.monthly.count
  );

  const isLow = dailyRemaining <= 5 || monthlyRemaining <= 10;
  const isExhausted = !data.canGenerate;

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
          오늘{" "}
          <strong>
            {dailyRemaining}/{data.limits.dailyLimit}
          </strong>
          회
        </span>
        <span className="text-gray-300">|</span>
        <span>
          이번 달{" "}
          <strong>
            {monthlyRemaining}/{data.limits.monthlyLimit}
          </strong>
          회
        </span>
      </div>
      {isExhausted && (
        <span className="ml-auto text-xs font-bold">한도 초과</span>
      )}
    </div>
  );
}
