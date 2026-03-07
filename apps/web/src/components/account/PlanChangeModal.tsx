"use client";

import { useMemo, useState } from "react";
import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

interface PlanChangeModalProps {
  open: boolean;
  currentPlan: PlanId;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

export default function PlanChangeModal({
  open,
  currentPlan,
  onClose,
  onChanged,
}: PlanChangeModalProps) {
  const [isDowngradingPlan, setIsDowngradingPlan] = useState<PlanId | null>(null);
  const [downgradeError, setDowngradeError] = useState<string | null>(null);

  const currentPrice = useMemo(() => PLANS[currentPlan].price, [currentPlan]);

  if (!open) {
    return null;
  }

  const handleDowngrade = async (planId: PlanId) => {
    setIsDowngradingPlan(planId);
    setDowngradeError(null);

    try {
      const res = await fetch("/api/billing/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error?.message ?? "Failed to downgrade plan.");
      }

      await onChanged();
      onClose();
    } catch (error) {
      setDowngradeError(
        error instanceof Error ? error.message : "Failed to downgrade plan."
      );
    } finally {
      setIsDowngradingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Change Plan</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-500"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>).map(
            ([planId, plan]) => {
              const isCurrent = planId === currentPlan;
              const isUpgrade = plan.price > currentPrice;
              const isDowngrade = !isCurrent && !isUpgrade;

              return (
                <div
                  key={planId}
                  className={`rounded-xl border p-4 ${
                    isCurrent
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-gray-200"
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{planId.toUpperCase()}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Speed {plan.flashLimit} / Precision {plan.proLimit}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    ₩{plan.price.toLocaleString()} /mo
                  </p>

                  <div className="mt-3">
                    {isCurrent ? (
                      <span className="inline-flex rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                        Current Plan
                      </span>
                    ) : null}

                    {isUpgrade ? (
                      <TossPaymentButton
                        type="subscription"
                        planId={planId}
                        label={`Upgrade to ${planId.toUpperCase()}`}
                        className="w-full"
                      />
                    ) : null}

                    {isDowngrade ? (
                      <button
                        type="button"
                        onClick={() => handleDowngrade(planId)}
                        disabled={isDowngradingPlan !== null}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDowngradingPlan === planId
                          ? "Applying..."
                          : `Switch to ${planId.toUpperCase()}`}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {downgradeError ? (
          <p className="mt-3 text-sm text-red-600">{downgradeError}</p>
        ) : null}
      </div>
    </div>
  );
}
