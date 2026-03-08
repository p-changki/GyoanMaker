"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type PlanId, type TopUpCreditType } from "@gyoanmaker/shared/plans";
import type { CreditEntry } from "@gyoanmaker/shared/types";
import UsageBar from "./UsageBar";
import DeleteAccountModal from "./DeleteAccountModal";
import CancelSubscriptionModal from "./CancelSubscriptionModal";
import PlanChangeModal from "./PlanChangeModal";
import TopUpModal from "./TopUpModal";
import SubscriptionInfoSection from "./SubscriptionInfoSection";
import CreditDetailsSection from "./CreditDetailsSection";
import PaymentHistorySection from "./PaymentHistorySection";
import UsageHistorySection from "./UsageHistorySection";
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
    storage: { limit: number | null; used: number; remaining: number | null };
  };
  planPendingTier: PlanId | null;
  account: { createdAt: string | null };
  credits: { flash: CreditEntry[]; pro: CreditEntry[]; illustration: CreditEntry[] };
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
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      {/* Profile */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
            <h2 className="text-lg font-bold text-gray-900">
              {session?.user?.name ?? "User"}
            </h2>
            <p className="text-sm text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
      </section>

      {/* Current Plan + Action Buttons */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Current Plan
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">
                {currentPlan.toUpperCase()}
              </h1>
              {isCanceled && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                  {periodEndAt ? `해지 예정 (~${formatDate(periodEndAt)})` : "해지 예정"}
                </span>
              )}
              {planPendingTier && !isCanceled && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  → {planPendingTier.toUpperCase()} 전환 예정
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Speed {data.quota.flash.remaining} / Precision {data.quota.pro.remaining} remaining
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowTopUpModal(true)}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Top Up
            </button>
            <button
              type="button"
              onClick={() => setShowPlanModal(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              Change Plan
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
          label="Speed Mode"
          used={data.quota.flash.used}
          limit={data.quota.flash.limit}
          remaining={data.quota.flash.remaining}
          credits={data.quota.flash.credits}
        />
        <UsageBar
          label="Precision Mode"
          used={data.quota.pro.used}
          limit={data.quota.pro.limit}
          remaining={data.quota.pro.remaining}
          credits={data.quota.pro.credits}
        />
      </section>

      {/* Credit Details */}
      <CreditDetailsSection
        flash={data.credits.flash}
        pro={data.credits.pro}
        illustration={data.credits.illustration}
      />

      {/* Payment History */}
      <PaymentHistorySection />

      {/* Usage History */}
      <UsageHistorySection />

      {/* Danger Zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-sm font-bold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-xs text-gray-500">
          Deleting your account will permanently remove all data and cannot be undone.
        </p>
        <div className="mt-4 flex gap-3">
          {showCancelButton && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="rounded-xl border border-yellow-400 px-4 py-2 text-sm font-bold text-yellow-700 transition-colors hover:bg-yellow-50"
            >
              Cancel Subscription
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            Delete Account
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
