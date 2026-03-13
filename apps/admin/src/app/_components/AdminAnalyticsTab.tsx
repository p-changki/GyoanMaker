"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodayOrder } from "@/app/api/analytics/today-orders/route";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AnalyticsData } from "@/app/api/analytics/route";

const PLAN_COLORS: Record<string, string> = {
  free: "#9ca3af",
  basic: "#60a5fa",
  standard: "#a78bfa",
  pro: "#f59e0b",
};

const MODEL_COLORS: Record<string, string> = {
  flash: "#34d399",
  pro: "#818cf8",
  unknown: "#9ca3af",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
      {children}
    </h2>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 shadow-sm border ${
        accent
          ? "bg-violet-50 border-violet-200"
          : "bg-white border-gray-200/60"
      } ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`text-xl font-bold mt-1 ${
          accent ? "text-violet-700" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      {onClick && (
        <p className="text-[10px] text-gray-400 mt-1">클릭하여 상세 보기 →</p>
      )}
    </div>
  );
}

function TodayOrdersModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<TodayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/today-orders")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json() as Promise<{ orders: TodayOrder[] }>;
      })
      .then((d) => setOrders(d.orders))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "오류 발생"))
      .finally(() => setLoading(false));
  }, []);

  const total = orders.reduce((sum, o) => sum + o.amount, 0);

  const orderTypeLabel = (type: string) => {
    if (type === "plan") return "플랜";
    if (type === "topup") return "충전";
    return type;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">오늘 결제 내역</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("ko-KR")} 기준 확정된 결제
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">오늘 결제 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{order.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {orderTypeLabel(order.orderType)}
                      {order.planTier ? ` · ${order.planTier}` : ""}
                      {" · "}
                      {new Date(order.confirmedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0 ml-4">
                    ₩{order.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && orders.length > 0 && (
          <div className="p-5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{orders.length}건</span>
            <span className="text-sm font-bold text-gray-900">
              합계 ₩{total.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Custom tooltip for revenue charts
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

export default function AdminAnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueView, setRevenueView] = useState<"monthly" | "daily">("monthly");
  const [usageView, setUsageView] = useState<"monthly" | "daily">("monthly");
  const [showTodayModal, setShowTodayModal] = useState(false);
  const openTodayModal = useCallback(() => setShowTodayModal(true), []);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json() as Promise<AnalyticsData>;
      })
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Unknown error")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl animate-pulse h-40" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-red-500 text-sm">
        {error ?? "데이터를 불러올 수 없습니다."}
      </div>
    );
  }

  const { summary, planDistribution, topUsers, modelStats, levelStats } = data;
  // Normalize chart data to a common shape with a "label" key
  const revenueChartData = (
    revenueView === "monthly" ? data.revenueTrend : data.dailyRevenue
  ).map((d) => ({
    label: "month" in d ? d.month : d.day,
    revenue: d.revenue,
    orders: d.orders,
  }));

  const usageChartData = (
    usageView === "monthly" ? data.usageTrend : data.dailyUsage
  ).map((d) => ({
    label: "month" in d ? d.month : d.day,
    requests: d.requests,
    passages: "passages" in d ? d.passages : 0,
  }));

  return (
    <div className="space-y-8">
      {/* ── Summary KPIs ── */}
      <section>
        <SectionTitle>핵심 지표</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="오늘 매출"
            value={`₩${summary.totalRevenueToday.toLocaleString()}`}
            onClick={openTodayModal}
          />
          <StatCard
            label="이번 달 매출"
            value={`₩${summary.totalRevenueThisMonth.toLocaleString()}`}
            accent
          />
          <StatCard
            label="오늘 API 호출"
            value={summary.totalRequestsToday.toLocaleString()}
          />
          <StatCard
            label="이번 달 API 호출"
            value={summary.totalRequestsThisMonth.toLocaleString()}
            sub={`AI 비용 $${summary.estimatedCostThisMonthUsd.toFixed(4)}`}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <StatCard
            label="전체 누적 매출"
            value={`₩${summary.totalRevenueAllTime.toLocaleString()}`}
          />
          <StatCard
            label="MRR (예상)"
            value={`₩${summary.mrr.toLocaleString()}`}
            sub="활성 유료 플랜 기준"
            accent
          />
          <StatCard
            label="전체 유저"
            value={summary.totalUsers.toLocaleString()}
            sub={`승인됨 ${summary.approvedUsers}명`}
          />
          <StatCard
            label="비활성 유저"
            value={summary.inactiveUserCount.toLocaleString()}
            sub="30일 미사용 (승인된 유저)"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <StatCard
            label="유료 플랜 유저"
            value={(
              summary.totalUsers -
              (planDistribution.find((p) => p.tier === "free")?.count ?? 0)
            ).toLocaleString()}
            sub="basic + standard + pro"
          />
          <StatCard
            label="평균 지문 수 / 요청"
            value={summary.avgPassagesPerRequest.toFixed(1)}
            sub="최근 30일 기준"
          />
          <StatCard
            label="이번 달 AI 비용"
            value={`$${summary.estimatedCostThisMonthUsd.toFixed(4)}`}
            sub="Gemini 2.5 Pro 기준"
          />
        </div>
      </section>

      {/* ── Revenue Trend ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>매출 추이</SectionTitle>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["monthly", "daily"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRevenueView(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  revenueView === v
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
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={revenueChartData}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            >
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
        </div>
      </section>

      {/* ── New User Trend ── */}
      <section>
        <SectionTitle>신규 가입자 추이 (최근 6개월)</SectionTitle>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.newUserTrend} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(value) => [`${value}명`, "신규 가입"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── API Usage Trend ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>API 호출 추이</SectionTitle>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["monthly", "daily"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setUsageView(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  usageView === v
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
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={usageChartData}
              margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
            >
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
              />
              <Tooltip content={<UsageTooltip />} />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3, fill: "#60a5fa" }}
                name="requests"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Plan Distribution ── */}
      <section>
        <SectionTitle>플랜 분포</SectionTitle>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  dataKey="count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {planDistribution.map((entry) => (
                    <Cell
                      key={entry.tier}
                      fill={PLAN_COLORS[entry.tier] ?? "#9ca3af"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value}명 (${planDistribution.find((p) => p.tier === String(name))?.pct ?? 0}%)`,
                    String(name).toUpperCase(),
                  ]}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600 uppercase">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-2">
              {planDistribution
                .sort((a, b) => b.count - a.count)
                .map((p) => (
                  <div key={p.tier} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 uppercase">
                        {p.tier}
                      </span>
                      <span className="text-gray-500">
                        {p.count}명 · {p.pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p.pct}%`,
                          backgroundColor: PLAN_COLORS[p.tier] ?? "#9ca3af",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Model & Level Stats ── */}
      <section>
        <SectionTitle>모델 · 레벨 사용 비율 (최근 30일)</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Model stats */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-3">모델별</p>
            {modelStats.length === 0 ? (
              <p className="text-xs text-gray-400">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {modelStats.map((m) => (
                  <div key={m.model} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 uppercase">
                        {m.model}
                      </span>
                      <span className="text-gray-500">
                        {m.requests}회 · {m.pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${m.pct}%`,
                          backgroundColor:
                            MODEL_COLORS[m.model] ?? "#9ca3af",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Level stats */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-3">레벨별</p>
            {levelStats.length === 0 ? (
              <p className="text-xs text-gray-400">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {levelStats.map((l) => (
                  <div key={l.level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 uppercase">
                        {l.level}
                      </span>
                      <span className="text-gray-500">
                        {l.requests}회 · {l.pct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${l.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Payment Method + Domain ── */}
      <section>
        <SectionTitle>결제 수단 · 이메일 도메인 분포</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Payment method */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-3">결제 수단 (최근 6개월)</p>
            {data.paymentMethodStats.length === 0 ? (
              <p className="text-xs text-gray-400">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {data.paymentMethodStats.map((m) => (
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

          {/* Email domain */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-3">이메일 도메인 Top 10</p>
            {data.emailDomainStats.length === 0 ? (
              <p className="text-xs text-gray-400">데이터 없음</p>
            ) : (
              <div className="space-y-2">
                {data.emailDomainStats.map((d) => (
                  <div key={d.domain} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 truncate max-w-40">
                        {d.domain}
                      </span>
                      <span className="text-gray-500 shrink-0 ml-2">
                        {d.count}명 · {d.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-300"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Inactive Users ── */}
      <section>
        <SectionTitle>비활성 유저 (승인됨 · 30일 미사용)</SectionTitle>
        <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
          {data.inactiveUsers.length === 0 ? (
            <p className="text-center py-8 text-gray-400 text-xs">비활성 유저 없음 🎉</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">이메일</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">플랜</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">가입 후 경과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.inactiveUsers.map((u) => (
                  <tr key={u.email} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-700 truncate max-w-60">
                      {u.email}
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
                    <td className="px-4 py-2.5 text-xs text-gray-500 text-right">
                      {u.daysSinceJoin}일
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Top Users ── */}
      <section>
        <SectionTitle>헤비 유저 (최근 30일 · 토큰 기준)</SectionTitle>
        <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  이메일
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  호출 수
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  총 토큰
                </th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  플랜
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-gray-400 text-xs"
                  >
                    데이터 없음
                  </td>
                </tr>
              ) : (
                topUsers.map((u, i) => (
                  <tr
                    key={u.email}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 truncate max-w-[200px]">
                      {u.email}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 text-right font-semibold">
                      {u.requests.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-700 text-right font-semibold">
                      {u.tokens >= 1000
                        ? `${(u.tokens / 1000).toFixed(1)}K`
                        : u.tokens.toLocaleString()}
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

      {showTodayModal && (
        <TodayOrdersModal onClose={() => setShowTodayModal(false)} />
      )}
    </div>
  );
}
