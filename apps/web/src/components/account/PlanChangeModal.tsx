"use client";

import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";

interface PlanChangeModalProps {
  open: boolean;
  currentPlan: PlanId;
  onClose: () => void;
  onSelect: (planId: PlanId) => void;
}

export default function PlanChangeModal({
  open,
  currentPlan,
  onClose,
  onSelect,
}: PlanChangeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">플랜 변경</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-500"
          >
            닫기
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(
            Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>
          ).map(([planId, plan]) => (
            <button
              key={planId}
              type="button"
              disabled={planId === currentPlan}
              onClick={() => onSelect(planId)}
              className={`rounded-xl border p-4 text-left ${
                planId === currentPlan
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-sm font-bold text-gray-900">
                {planId.toUpperCase()}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                빠른 생성 {plan.flashLimit} / 정밀 생성 {plan.proLimit}
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                ₩{plan.price.toLocaleString("ko-KR")} /월
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
