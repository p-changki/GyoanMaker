"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type PlanId } from "@gyoanmaker/shared/plans";
import UsageBar from "./UsageBar";
import DeleteAccountModal from "./DeleteAccountModal";
import PlanChangeModal from "./PlanChangeModal";
import TopUpPanel from "./TopUpPanel";

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

function isPlanId(value: string | null): value is PlanId {
  return value === "free" || value === "basic" || value === "standard" || value === "pro";
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
  const [showPlanModal, setShowPlanModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-status"],
    queryFn: fetchBillingStatus,
  });

  const currentPlan = data?.subscription?.tier ?? "free";
  const targetPlan = useMemo(() => {
    const value = searchParams.get("targetPlan");
    return isPlanId(value) ? value : null;
  }, [searchParams]);
  const autoOpenPlanModal = targetPlan !== null && targetPlan !== currentPlan;
  const isPlanModalOpen = showPlanModal || autoOpenPlanModal;

  const clearTargetPlanQuery = () => {
    if (!searchParams.get("targetPlan")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("targetPlan");
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
              Speed {data.quota.flash.remaining} / Precision {data.quota.pro.remaining} remaining
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPlanModal(true)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Change Plan
          </button>
        </div>
      </section>

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

      <TopUpPanel />

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h3 className="text-sm font-bold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-xs text-gray-500">
          Deleting your account will permanently remove all data and cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
        >
          Delete Account
        </button>
      </section>

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
