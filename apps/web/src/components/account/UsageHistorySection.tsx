"use client";

import { useQuery } from "@tanstack/react-query";

interface UsageLogRow {
  requestId: string;
  model: string;
  level: string;
  passageCount: number;
  totalTokens: number;
  createdAt: string;
}

interface UsageResponse {
  logs: UsageLogRow[];
  summary: { totalRequests: number; totalPassages: number };
}

function formatDateKr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function modelLabel(model: string): string {
  if (model === "flash" || model.includes("flash")) return "Speed";
  if (model === "pro" || model.includes("pro")) return "Precision";
  return model;
}

function levelLabel(level: string): string {
  if (level === "advanced") return "Advanced";
  if (level === "basic") return "Basic";
  return level;
}

async function fetchUsage(): Promise<UsageResponse> {
  const res = await fetch("/api/billing/usage");
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

export default function UsageHistorySection() {
  const { data, isLoading } = useQuery({
    queryKey: ["billing-usage"],
    queryFn: fetchUsage,
  });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          Usage History
        </h3>
        {data && data.summary.totalRequests > 0 && (
          <span className="text-xs text-gray-400">
            총 {data.summary.totalRequests}회 / {data.summary.totalPassages}지문
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 h-16 animate-pulse rounded-lg bg-gray-100" />
      ) : !data || data.logs.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">사용 이력이 없습니다</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="pb-2 font-medium">날짜</th>
                <th className="pb-2 font-medium">모델</th>
                <th className="pb-2 font-medium">레벨</th>
                <th className="pb-2 text-right font-medium">지문</th>
                <th className="pb-2 text-right font-medium">토큰</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.logs.map((log) => (
                <tr key={log.requestId}>
                  <td className="py-2.5 text-gray-500">
                    {formatDateKr(log.createdAt)}
                  </td>
                  <td className="py-2.5 text-gray-700">
                    {modelLabel(log.model)}
                  </td>
                  <td className="py-2.5 text-gray-700">
                    {levelLabel(log.level)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    {log.passageCount}
                  </td>
                  <td className="py-2.5 text-right text-gray-500">
                    {log.totalTokens.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
