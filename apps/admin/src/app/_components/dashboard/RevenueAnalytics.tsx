"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { AnalyticsData } from "@/app/api/analytics/route";

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-gray-600">
          {p.name === "revenue" ? `₩${p.value.toLocaleString()}` : `${p.value}건`}
        </p>
      ))}
    </div>
  );
}

interface RevenueAnalyticsProps {
  analytics: AnalyticsData | null;
  onOpenTodayModal: () => void;
}

export default function RevenueAnalytics({ analytics, onOpenTodayModal }: RevenueAnalyticsProps) {
  const [view, setView] = useState<"monthly" | "daily">("monthly");

  if (!analytics) return null;

  const { summary, paymentMethodStats } = analytics;

  const chartData = (
    view === "monthly" ? analytics.revenueTrend : analytics.dailyRevenue
  ).map((d) => ({
    label: "month" in d ? d.month : d.day,
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={onOpenTodayModal}
          className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60 text-left hover:shadow-md transition-shadow"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">오늘 매출</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            ₩{summary.totalRevenueToday.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">클릭하여 상세 보기 →</p>
        </button>
        <div className="rounded-xl p-4 shadow-sm border bg-violet-50 border-violet-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">이번달 매출</p>
          <p className="text-xl font-bold text-violet-700 mt-1">
            ₩{summary.totalRevenueThisMonth.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">전체 누적</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            ₩{summary.totalRevenueAllTime.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-violet-50 border-violet-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MRR</p>
          <p className="text-xl font-bold text-violet-700 mt-1">
            ₩{summary.mrr.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">활성 유료 플랜 기준</p>
        </div>
      </div>

      {/* Revenue trend chart */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">매출 추이</h3>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["monthly", "daily"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  view === v
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v === "monthly" ? "월별" : "일별 (30일)"}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          {chartData.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-xs">데이터 없음</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                  }
                />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="revenue" fill="#a78bfa" radius={[4, 4, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Payment method breakdown */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          결제 수단 분포 (최근 6개월)
        </h3>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          {paymentMethodStats.length === 0 ? (
            <p className="text-xs text-gray-400">데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {paymentMethodStats.map((m) => (
                <div key={m.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{m.method}</span>
                    <span className="text-gray-500">
                      {m.count}건 · ₩{m.revenue.toLocaleString()} · {m.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
