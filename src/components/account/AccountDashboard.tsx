"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { type PlanId } from "@/lib/plans";
import UsageBar from "./UsageBar";

interface BillingStatusResponse {
  subscription: {
    tier: PlanId;
    status: "active" | "past_due" | "canceled";
    currentPeriodStartAt: string;
    currentPeriodEndAt: string | null;
  };
  quota: {
    plan: PlanId;
    flash: { limit: number; used: number; remaining: number; credits: number };
    pro: { limit: number; used: number; remaining: number; credits: number };
    storage: { limit: number | null; used: number; remaining: number | null };
  };
}

async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  const res = await fetch("/api/billing/status");
  if (!res.ok) throw new Error("결제 상태 조회 실패");
  return res.json();
}

export default function AccountDashboard() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
  });

  const currentPlan = data?.subscription.tier ?? "free";

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="프로필"
              className="h-14 w-14 rounded-full border border-gray-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500">
              {session?.user?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {session?.user?.name ?? "사용자"}
            </h2>
            <p className="text-sm text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Current Plan
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
              {currentPlan.toUpperCase()}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Flash {data.quota.flash.remaining}건 / Pro{" "}
              {data.quota.pro.remaining}건 남음
            </p>
          </div>
          <button
            type="button"
            disabled
            className="rounded-xl bg-gray-300 px-4 py-2 text-sm font-bold text-white cursor-not-allowed"
          >
            준비중
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UsageBar
          label="Flash"
          used={data.quota.flash.used}
          limit={data.quota.flash.limit}
          remaining={data.quota.flash.remaining}
          credits={data.quota.flash.credits}
        />
        <UsageBar
          label="Pro"
          used={data.quota.pro.used}
          limit={data.quota.pro.limit}
          remaining={data.quota.pro.remaining}
          credits={data.quota.pro.credits}
        />
      </section>

      <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <p className="text-sm font-medium text-gray-500">
          결제 시스템 준비중입니다
        </p>
        <p className="mt-1 text-xs text-gray-400">
          플랜 변경 및 크레딧 충전은 곧 오픈 예정입니다.
        </p>
      </section>
    </div>
  );
}
