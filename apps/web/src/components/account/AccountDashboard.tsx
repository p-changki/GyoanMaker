"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type PlanId, type TopUpCreditType, PLANS } from "@gyoanmaker/shared/plans";
import type { CreditEntry } from "@gyoanmaker/shared/types";
import UsageBar from "./UsageBar";
import DeleteAccountModal from "./DeleteAccountModal";
import CancelSubscriptionModal from "./CancelSubscriptionModal";
import PlanChangeModal from "./PlanChangeModal";
import TopUpModal from "./TopUpModal";
import SubscriptionInfoSection from "./SubscriptionInfoSection";
import HistoryTabs from "./HistoryTabs";
import BillingKeySection from "./BillingKeySection";

interface BillingStatusResponse {
  subscription: {
    tier: PlanId;
    status: "active" | "past_due" | "canceled";
    currentPeriodStartAt: string;
    currentPeriodEndAt: string | null;
    paymentMethod: string | null;
  };
  quota: {
    plan: PlanId;
    monthKeyKst: string;
    flash: { limit: number; used: number; remaining: number; credits: number };
    pro: { limit: number; used: number; remaining: number; credits: number };
    illustration: { limit: number; used: number; remaining: number; credits: number };
    storage: { limit: number | null; used: number; remaining: number | null };
  };
  planPendingTier: PlanId | null;
  account: { createdAt: string | null };
  credits: { flash: CreditEntry[]; pro: CreditEntry[]; illustration: CreditEntry[] };
  illustrationSamples: { count: number };
  dailySampleUsage: { used: number; limit: number };
}

function isPlanId(value: string | null): value is PlanId {
  return value === "free" || value === "basic" || value === "standard" || value === "pro";
}

function isTopUpCreditType(value: string | null): value is TopUpCreditType {
  return value === "flash" || value === "pro" || value === "illustration";
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  const res = await fetch("/api/billing/status");
  if (!res.ok) throw new Error("Failed to fetch billing status");
  return res.json();
}

export default function AccountDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
  });

  const currentPlan = data?.subscription?.tier ?? "free";
  const subscriptionStatus = data?.subscription?.status ?? "active";
  const periodEndAt = data?.subscription?.currentPeriodEndAt ?? null;
  const isCanceled = subscriptionStatus === "canceled";
  const planPendingTier = data?.planPendingTier ?? null;
  const showCancelButton = currentPlan !== "free" && !isCanceled;

  const targetPlan = useMemo(() => {
    const value = searchParams.get("targetPlan");
    return isPlanId(value) ? value : null;
  }, [searchParams]);
  const autoOpenPlanModal = targetPlan !== null && targetPlan !== currentPlan;
  const isPlanModalOpen = showPlanModal || autoOpenPlanModal;
  const topUpTypeParam = searchParams.get("topup");
  const autoOpenTopUpModal = isTopUpCreditType(topUpTypeParam);
  const isTopUpModalOpen = showTopUpModal || autoOpenTopUpModal;
  const defaultTopUpType: TopUpCreditType = isTopUpCreditType(topUpTypeParam)
    ? topUpTypeParam
    : "flash";

  const clearTargetPlanQuery = () => {
    if (!searchParams.get("targetPlan")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("targetPlan");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  const clearTopUpQuery = () => {
    if (!searchParams.get("topup")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("topup");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

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
                {isCanceled && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                    {periodEndAt ? `해지 예정 (~${formatDate(periodEndAt)})` : "해지 예정"}
                  </span>
                )}
                {planPendingTier && !isCanceled && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                    → {planPendingTier.toUpperCase()} 전환 예정
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

          {/* Right: action buttons */}
          <div className="flex gap-2 sm:shrink-0">
            <button
              type="button"
              onClick={() => setShowTopUpModal(true)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              충전
            </button>
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              플랜 변경
            </button>
          </div>
        </div>
      </section>

      {/* Subscription Info */}
      <SubscriptionInfoSection
        tier={currentPlan}
        currentPeriodStartAt={data.subscription.currentPeriodStartAt}
        currentPeriodEndAt={periodEndAt}
        paymentMethod={data.subscription.paymentMethod}
        planPendingTier={planPendingTier}
        createdAt={data.account.createdAt}
        monthKeyKst={data.quota.monthKeyKst}
      />

      {/* Payment Method */}
      <BillingKeySection />

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
          {showCancelButton && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-bold text-yellow-700 transition-colors hover:bg-yellow-50"
            >
              구독 취소
            </button>
          )}
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
      <TopUpModal
        open={isTopUpModalOpen}
        defaultType={defaultTopUpType}
        onClose={() => {
          setShowTopUpModal(false);
          clearTopUpQuery();
        }}
      />

      <PlanChangeModal
        open={isPlanModalOpen}
        currentPlan={currentPlan}
        onClose={() => {
          setShowPlanModal(false);
          clearTargetPlanQuery();
        }}
        onChanged={async () => {
          await queryClient.invalidateQueries({ queryKey: ["billing-status"] });
        }}
      />

      <CancelSubscriptionModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        periodEndAt={periodEndAt}
        onConfirm={async () => {
          const res = await fetch("/api/billing/cancel-subscription", {
            method: "POST",
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error?.message ?? "Cancellation failed");
          }
          await queryClient.invalidateQueries({ queryKey: ["billing-status"] });
        }}
      />

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
