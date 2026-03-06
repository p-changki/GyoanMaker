"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { type PlanId } from "@gyoanmaker/shared/plans";
import UsageBar from "./UsageBar";
import DeleteAccountModal from "./DeleteAccountModal";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
  });

  const currentPlan = data?.subscription?.tier ?? "free";

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
            <Image
              src={session.user.image}
              alt="프로필"
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
              빠른 생성 {data.quota.flash.remaining}건 / 정밀 생성{" "}
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
          label="빠른 생성"
          used={data.quota.flash.used}
          limit={data.quota.flash.limit}
          remaining={data.quota.flash.remaining}
          credits={data.quota.flash.credits}
        />
        <UsageBar
          label="정밀 생성"
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

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-sm font-bold text-red-700">위험 구역</h3>
        <p className="mt-1 text-xs text-gray-500">
          계정을 삭제하면 모든 데이터가 영구 삭제되며 복구할 수 없습니다.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
        >
          계정 탈퇴
        </button>
      </section>

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          const res = await fetch("/api/account/delete", { method: "DELETE" });
          if (!res.ok) throw new Error("삭제 실패");
          signOut({ callbackUrl: "/" });
        }}
      />
    </div>
  );
}
