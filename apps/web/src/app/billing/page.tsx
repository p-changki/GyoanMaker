"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type PlanId } from "@gyoanmaker/shared/plans";
import PlanSection from "@/components/billing/PlanSection";
import TopUpSection from "@/components/billing/TopUpSection";
import BankTransferSection from "@/components/billing/BankTransferSection";

type Tab = "plan" | "topup" | "bank";

function isTab(value: string | null): value is Tab {
  return value === "plan" || value === "topup" || value === "bank";
}

function isPlanId(value: string | null): value is PlanId {
  return value === "free" || value === "basic" || value === "standard" || value === "pro";
}

interface BillingStatusResponse {
  subscription: {
    tier: PlanId;
    status: "active" | "expired";
    currentPeriodEndAt: string | null;
  };
  quota: {
    flash: { remaining: number; limit: number };
    pro: { remaining: number; limit: number };
  };
}

async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  const res = await fetch("/api/billing/status");
  if (!res.ok) throw new Error("Failed to fetch billing status");
  return res.json();
}

const TABS: { key: Tab; label: string }[] = [
  { key: "bank", label: "무통장입금" },
  { key: "plan", label: "이용권 구매" },
  { key: "topup", label: "크레딧 충전" },
];

function BillingPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: Tab = isTab(tabParam) ? tabParam : "bank";
  const targetParam = searchParams.get("target");
  const targetPlan = isPlanId(targetParam) ? targetParam : null;

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
    staleTime: 60_000,
  });

  const currentPlan = data?.subscription?.tier ?? "free";
  const periodEndAt = data?.subscription?.currentPeriodEndAt ?? null;
  const isExpired = periodEndAt ? new Date(periodEndAt) < new Date() : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">결제</h1>
        <Link
          href="/account"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          계정으로 돌아가기
        </Link>
      </div>

      {/* Plan summary bar */}
      {isLoading ? (
        <div className="mb-6 h-16 animate-pulse rounded-xl bg-gray-100" />
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
              {currentPlan.toUpperCase()}
            </span>
            {currentPlan !== "free" && periodEndAt && (
              <span className={`text-xs ${isExpired ? "font-semibold text-red-600" : "text-gray-500"}`}>
                {isExpired ? "만료됨" : `만료일 ${new Date(periodEndAt).toLocaleDateString("ko-KR")}`}
              </span>
            )}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>속도 {data?.quota.flash.remaining ?? 0}/{data?.quota.flash.limit ?? 0}</span>
            <span>정밀 {data?.quota.pro.remaining ?? 0}/{data?.quota.pro.limit ?? 0}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={`/billing?tab=${key}`}
            prefetch={false}
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "plan" && (
        <PlanSection currentPlan={currentPlan} targetPlan={targetPlan} />
      )}
      {activeTab === "topup" && <TopUpSection />}
      {activeTab === "bank" && <BankTransferSection />}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />
          <div className="mt-6 h-16 animate-pulse rounded-xl bg-gray-100" />
          <div className="mt-6 h-10 animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
