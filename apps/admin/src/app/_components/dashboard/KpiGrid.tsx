"use client";

import StatCard from "../shared/StatCard";
import type { AnalyticsData } from "@/app/api/analytics/route";

interface KpiGridProps {
  analytics: AnalyticsData | null;
  pendingUserCount: number;
  monthlyOrderCount: number;
  paidNotAppliedCount: number;
  onOpenTodayModal?: () => void;
}

export default function KpiGrid({
  analytics,
  pendingUserCount,
  monthlyOrderCount,
  paidNotAppliedCount,
  onOpenTodayModal,
}: KpiGridProps) {
  const summary = analytics?.summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatCard
        label="이번달 매출"
        value={`₩${(summary?.totalRevenueThisMonth ?? 0).toLocaleString()}`}
        sub={`MRR ₩${(summary?.mrr ?? 0).toLocaleString()}`}
        accent
        onClick={onOpenTodayModal}
      />
      <StatCard
        label="활성 유저"
        value={(summary?.approvedUsers ?? 0).toLocaleString()}
        sub={`전체 ${(summary?.totalUsers ?? 0).toLocaleString()}명`}
      />
      <StatCard
        label="오늘 API 호출"
        value={(summary?.totalRequestsToday ?? 0).toLocaleString()}
        sub={`이번달 ${(summary?.totalRequestsThisMonth ?? 0).toLocaleString()}회`}
      />
      <StatCard
        label="미승인 유저"
        value={pendingUserCount}
        sub="승인 대기 중"
        alert={pendingUserCount > 0}
      />
      <StatCard
        label="이번달 주문"
        value={monthlyOrderCount.toLocaleString()}
        sub={paidNotAppliedCount > 0 ? `미적용 ${paidNotAppliedCount}건 ⚠` : "정상"}
        alert={paidNotAppliedCount > 0}
      />
      <StatCard
        label="AI 비용 (월)"
        value={`$${(summary?.estimatedCostThisMonthUsd ?? 0).toFixed(4)}`}
        sub="Gemini 2.5 기준"
      />
    </div>
  );
}
