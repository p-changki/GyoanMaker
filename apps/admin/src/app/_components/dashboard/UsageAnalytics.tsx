"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { AnalyticsData } from "@/app/api/analytics/route";
import { MODEL_COLORS, PLAN_COLORS, LEVEL_COLORS } from "./analytics.constants";

function UsageTooltip({
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
          {p.name === "requests" ? `${p.value}회 호출` : `${p.value}개 지문`}
        </p>
      ))}
    </div>
  );
}

interface UsageAnalyticsProps {
  analytics: AnalyticsData | null;
}

export default function UsageAnalytics({ analytics }: UsageAnalyticsProps) {
  const [view, setView] = useState<"monthly" | "daily">("monthly");

  if (!analytics) return null;

  const { summary, modelStats, levelStats, topUsers } = analytics;

  const chartData = (
    view === "monthly" ? analytics.usageTrend : analytics.dailyUsage
  ).map((d) => ({
    label: "month" in d ? d.month : d.day,
    requests: d.requests,
    passages: "passages" in d ? d.passages : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">오늘 호출</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{summary.totalRequestsToday.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">이번달 호출</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{summary.totalRequestsThisMonth.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">평균 지문/요청</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{summary.avgPassagesPerRequest.toFixed(1)}</p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI 비용 (월)</p>
          <p className="text-xl font-bold text-gray-900 mt-1">${summary.estimatedCostThisMonthUsd.toFixed(4)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Gemini 2.5 기준</p>
        </div>
      </div>

      {/* Usage trend */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">API 호출 추이</h3>
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
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<UsageTooltip />} />
                <Line type="monotone" dataKey="requests" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa" }} name="requests" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Model & Level ratio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">모델별 사용 (30일)</p>
          {modelStats.length === 0 ? (
            <p className="text-xs text-gray-400">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {modelStats.map((m) => (
                <div key={m.model} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 uppercase">{m.model}</span>
                    <span className="text-gray-500">{m.requests}회 · {m.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.pct}%`, backgroundColor: MODEL_COLORS[m.model] ?? "#9ca3af" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">레벨별 사용 (30일)</p>
          {levelStats.length === 0 ? (
            <p className="text-xs text-gray-400">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {levelStats.map((l) => (
                <div key={l.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 uppercase">{l.level}</span>
                    <span className="text-gray-500">{l.requests}회 · {l.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${l.pct}%`, backgroundColor: LEVEL_COLORS[l.level] ?? "#60a5fa" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Top users */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          헤비 유저 (30일 · 토큰 기준)
        </h3>
        <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">이메일</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">호출</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">토큰</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">플랜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">데이터 없음</td>
                </tr>
              ) : (
                topUsers.map((u, i) => (
                  <tr key={u.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 truncate max-w-[200px]">{u.email}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 text-right font-semibold">{u.requests.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 text-right font-semibold">
                      {u.tokens >= 1000 ? `${(u.tokens / 1000).toFixed(1)}K` : u.tokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full"
                        style={{
                          backgroundColor: `${PLAN_COLORS[u.plan] ?? "#9ca3af"}20`,
                          color: PLAN_COLORS[u.plan] ?? "#9ca3af",
                        }}
                      >
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
