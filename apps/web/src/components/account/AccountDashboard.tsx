"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { type PlanId, PLANS } from "@gyoanmaker/shared/plans";
import type { CreditEntry } from "@gyoanmaker/shared/types";
import UsageBar from "./UsageBar";
import DeleteAccountModal from "./DeleteAccountModal";
import SubscriptionInfoSection from "./SubscriptionInfoSection";
import RecentOrders from "./RecentOrders";
import HistoryTabs from "./HistoryTabs";

interface BillingStatusResponse {
  subscription: {
    tier: PlanId;
    status: "active" | "expired";
    currentPeriodStartAt: string;
    currentPeriodEndAt: string | null;
  };
  quota: {
    plan: PlanId;
    monthKeyKst: string;
    flash: { limit: number; used: number; remaining: number; credits: number };
    pro: { limit: number; used: number; remaining: number; credits: number };
    illustration: { limit: number; used: number; remaining: number; credits: number };
    storage: { limit: number | null; used: number; remaining: number | null };
  };
  account: { createdAt: string | null };
  credits: { flash: CreditEntry[]; pro: CreditEntry[]; illustration: CreditEntry[] };
  illustrationSamples: { count: number };
  dailySampleUsage: { used: number; limit: number };
}

async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  const res = await fetch("/api/billing/status");
  if (!res.ok) throw new Error("Failed to fetch billing status");
  return res.json();
}

export default function AccountDashboard() {
  const { data: session } = useSession();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
  });

  const currentPlan = data?.subscription?.tier ?? "free";
  const periodEndAt = data?.subscription?.currentPeriodEndAt ?? null;

  const now = new Date();
  const endDate = periodEndAt ? new Date(periodEndAt) : null;
  const isExpired = endDate ? endDate < now : false;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        {/* Profile skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>
        {/* Quota skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
          <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
        {/* Subscription skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        {/* History skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      {/* Profile + Plan */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-gray-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-500">
                {session?.user?.name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {session?.user?.name ?? "User"}
                </h2>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                  {currentPlan.toUpperCase()}
                </span>
                {currentPlan !== "free" && periodEndAt && new Date(periodEndAt) < new Date() && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    만료됨
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {data.account.createdAt
                  ? `가입일 ${new Date(data.account.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}`
                  : ""}
                {data.account.createdAt ? " · " : ""}
                속도 {data.quota.flash.remaining} / 정밀 {data.quota.pro.remaining} 남음
              </p>
            </div>
          </div>

          {/* Right: action button */}
          <Link
            href="/billing"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 sm:shrink-0"
          >
            결제하기
          </Link>
        </div>
      </section>

      {/* Expiry warning banner */}
      {currentPlan !== "free" && isExpired && (
        <section className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-5">
          <div>
            <p className="text-sm font-bold text-red-700">이용권이 만료되었습니다</p>
            <p className="mt-0.5 text-xs text-red-600/80">
              서비스를 계속 이용하려면 이용권을 다시 구매해주세요.
            </p>
          </div>
          <Link
            href="/billing"
            className="shrink-0 rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            다시 구매하기
          </Link>
        </section>
      )}
      {currentPlan !== "free" && isExpiringSoon && (
        <section className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div>
            <p className="text-sm font-bold text-amber-700">
              이용권 만료 D-{daysLeft}
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80">
              {endDate!.toLocaleDateString("ko-KR")}에 만료됩니다. 미리 갱신하세요.
            </p>
          </div>
          <Link
            href="/billing"
            className="shrink-0 rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
          >
            갱신하기
          </Link>
        </section>
      )}

      {/* Plan Info */}
      <SubscriptionInfoSection
        tier={currentPlan}
        currentPeriodStartAt={data.subscription.currentPeriodStartAt}
        currentPeriodEndAt={periodEndAt}
        createdAt={data.account.createdAt}
      />

      {/* Quota */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UsageBar
          label="속도 모드"
          used={data.quota.flash.used}
          limit={data.quota.flash.limit}
          remaining={data.quota.flash.remaining}
          credits={data.quota.flash.credits}
        />
        <UsageBar
          label="정밀 모드"
          used={data.quota.pro.used}
          limit={data.quota.pro.limit}
          remaining={data.quota.pro.remaining}
          credits={data.quota.pro.credits}
        />
      </section>

      {/* Illustration Quota */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <UsageBar
          label="일러스트 크레딧"
          used={data.quota.illustration.used}
          limit={data.quota.illustration.limit}
          remaining={data.quota.illustration.remaining}
          credits={data.quota.illustration.credits}
        />
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-gray-900">일일 일러스트 테스트</p>
            <p className="font-medium text-gray-500">
              {data.dailySampleUsage.used}/{data.dailySampleUsage.limit}
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={
                data.dailySampleUsage.used >= data.dailySampleUsage.limit
                  ? "h-full bg-amber-500"
                  : "h-full bg-emerald-500"
              }
              style={{
                width: `${Math.min(100, Math.round((data.dailySampleUsage.used / data.dailySampleUsage.limit) * 100))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            매일 자정(KST)에 초기화
          </p>
        </div>
      </section>

      {/* Illustration Samples */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-semibold text-gray-900">일러스트 샘플</p>
            <p className="font-medium text-gray-500">
              {data.illustrationSamples.count}/{PLANS[currentPlan].maxSamples}
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={
                data.illustrationSamples.count >= PLANS[currentPlan].maxSamples
                  ? "h-full bg-amber-500"
                  : "h-full bg-emerald-500"
              }
              style={{
                width: `${Math.min(100, Math.round((data.illustrationSamples.count / PLANS[currentPlan].maxSamples) * 100))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {PLANS[currentPlan].maxSamples - data.illustrationSamples.count}개 슬롯 남음
          </p>
        </div>
      </section>

      {/* Recent Orders */}
      <RecentOrders />

      {/* History Tabs */}
      <HistoryTabs
        flash={data.credits.flash}
        pro={data.credits.pro}
        illustration={data.credits.illustration}
      />

      {/* Refund Guide */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
        <h3 className="text-sm font-bold text-blue-700">환불 요청 안내</h3>
        <p className="mt-1 text-xs text-gray-600">
          환불은 현재 이메일 접수 기반으로 처리됩니다. 아래 필수 항목을 함께 보내주세요.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-gray-600">
          <li>접수 이메일: dnsxj12345aa@gmail.com</li>
          <li>필수 기재 항목: 주문 ID, 계정 이메일, 환불 사유</li>
          <li>처리 기준: 영업일 7일 이내 순차 처리</li>
        </ul>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-sm font-bold text-red-700">위험 구역</h3>
        <p className="mt-1 text-xs text-gray-500">
          계정을 삭제하면 모든 데이터가 영구적으로 제거되며 되돌릴 수 없습니다.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            계정 삭제
          </button>
        </div>
      </section>

      {/* Modals */}
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          const res = await fetch("/api/account/delete", { method: "DELETE" });
          if (!res.ok) throw new Error("Deletion failed");
          signOut({ callbackUrl: "/" });
        }}
      />
    </div>
  );
}
