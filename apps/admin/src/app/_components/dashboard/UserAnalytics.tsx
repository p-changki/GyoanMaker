"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { AnalyticsData } from "@/app/api/analytics/route";
import { PLAN_COLORS } from "./analytics.constants";
import RecentActivityFeed from "./RecentActivityFeed";

interface AppUser {
  email: string;
  name: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
  createdAt: string;
}

interface UserAnalyticsProps {
  analytics: AnalyticsData | null;
  users: AppUser[];
}

export default function UserAnalytics({ analytics, users }: UserAnalyticsProps) {
  if (!analytics) return null;

  const { summary, planDistribution, inactiveUsers, emailDomainStats, newUserTrend } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">전체 유저</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{summary.totalUsers.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">승인됨 {summary.approvedUsers}명</p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">유료 플랜</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {(summary.totalUsers - (planDistribution.find((p) => p.tier === "free")?.count ?? 0)).toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">basic + standard + pro</p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-amber-50 border-amber-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">비활성 유저</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{summary.inactiveUserCount.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">30일 미사용</p>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white border-gray-200/60">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">대기 중</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {users.filter((u) => u.status === "pending").length}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">승인 대기</p>
        </div>
      </div>

      {/* Plan distribution */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">플랜 분포</h3>
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
                    <Cell key={entry.tier} fill={PLAN_COLORS[entry.tier] ?? "#9ca3af"} />
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
                    <span className="text-xs text-gray-600 uppercase">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {[...planDistribution]
                .sort((a, b) => b.count - a.count)
                .map((p) => (
                  <div key={p.tier} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 uppercase">{p.tier}</span>
                      <span className="text-gray-500">{p.count}명 · {p.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${p.pct}%`, backgroundColor: PLAN_COLORS[p.tier] ?? "#9ca3af" }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* New user trend */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          신규 가입 추이 (6개월)
        </h3>
        <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          {newUserTrend.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-xs">데이터 없음</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={newUserTrend} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
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
          )}
        </div>
      </section>

      {/* Email domain + Inactive users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">이메일 도메인 Top 10</p>
          {emailDomainStats.length === 0 ? (
            <p className="text-xs text-gray-400">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {emailDomainStats.map((d) => (
                <div key={d.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 truncate max-w-40">{d.domain}</span>
                    <span className="text-gray-500 shrink-0 ml-2">{d.count}명 · {d.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-300" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 mb-3">비활성 유저 (30일 미사용)</p>
          {inactiveUsers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">비활성 유저 없음</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {inactiveUsers.map((u) => (
                <div key={u.email} className="flex items-center justify-between text-xs py-1">
                  <span className="text-gray-700 truncate max-w-40">{u.email}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{
                        backgroundColor: `${PLAN_COLORS[u.plan] ?? "#9ca3af"}20`,
                        color: PLAN_COLORS[u.plan] ?? "#9ca3af",
                      }}
                    >
                      {u.plan.toUpperCase()}
                    </span>
                    <span className="text-gray-400">{u.daysSinceJoin}일</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">최근 가입 유저</h3>
        <RecentActivityFeed users={users} />
      </section>
    </div>
  );
}
