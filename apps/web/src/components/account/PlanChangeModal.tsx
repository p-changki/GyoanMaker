"use client";

import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

interface PlanChangeModalProps {
  open: boolean;
  currentPlan: PlanId;
  onClose: () => void;
}

export default function PlanChangeModal({
  open,
  currentPlan,
  onClose,
}: PlanChangeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">이용권 구매</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-500"
          >
            닫기
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          구매 즉시 적용되며, 30일 이용권입니다.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>).map(
            ([planId, plan]) => {
              if (planId === "free") return null;
              const isCurrent = planId === currentPlan;

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
                    속도 {plan.flashLimit} / 정밀 {plan.proLimit}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    ₩{plan.price.toLocaleString()} / 30일
                  </p>

                  <p className="mt-2 text-xs text-gray-500">결제 방식 선택</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <TossPaymentButton
                      type="plan"
                      planId={planId}
                      checkoutFlow="widget"
                      label={isCurrent ? "위젯 연장" : "위젯 구매"}
                      className="w-full"
                    />
                    <TossPaymentButton
                      type="plan"
                      planId={planId}
                      checkoutFlow="paylink"
                      label={isCurrent ? "페이링크 연장" : "페이링크 구매"}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
