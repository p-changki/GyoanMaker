"use client";

import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "./TossPaymentButton";

interface PlanSectionProps {
  currentPlan: PlanId;
  targetPlan?: PlanId | null;
}

export default function PlanSection({ currentPlan, targetPlan }: PlanSectionProps) {
  return (
    <div>
      <p className="mb-4 text-xs text-gray-400">
        구매 즉시 적용 · 30일 이용권 · VAT 별도
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>).map(
          ([planId, plan]) => {
            if (planId === "free") return null;
            const isCurrent = planId === currentPlan;
            const isTarget = planId === targetPlan;

            return (
              <div
                key={planId}
                className={`relative rounded-xl border-2 p-5 transition-shadow ${
                  isTarget
                    ? "border-blue-500 shadow-lg shadow-blue-100"
                    : isCurrent
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-gray-200"
                }`}
              >
                {/* Badges */}
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {planId.toUpperCase()}
                  </h3>
                  {isCurrent && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      현재 플랜
                    </span>
                  )}
                  {isTarget && !isCurrent && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      추천
                    </span>
                  )}
                </div>

                <p className="text-2xl font-extrabold text-gray-900">
                  ₩{plan.price.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">/ 30일</p>

                <ul className="mt-4 space-y-1 text-sm text-gray-600">
                  <li>속도 {plan.flashLimit}회</li>
                  <li>정밀 {plan.proLimit}회</li>
                  <li>삽화 {plan.illustrationMonthlyLimit}/월</li>
                </ul>

                <p className="mt-4 text-xs text-gray-500">결제 방식 선택</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <TossPaymentButton
                    type="plan"
                    planId={planId}
                    checkoutFlow="widget"
                    label={isCurrent ? "위젯 연장" : "위젯 구매"}
                    className="w-full bg-gray-900 hover:bg-gray-800"
                  />
                  <TossPaymentButton
                    type="plan"
                    planId={planId}
                    checkoutFlow="paylink"
                    label={isCurrent ? "페이링크 연장" : "페이링크 구매"}
                    className="w-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                  />
                </div>
                <p className="mt-2 text-[11px] text-amber-600">
                  페이링크 결제는 승인 완료 후 활성화됩니다.
                </p>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
