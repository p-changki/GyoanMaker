"use client";

import type { PlanDefinition, PlanId } from "@/lib/plans";

interface PricingCardProps {
  planId: PlanId;
  plan: PlanDefinition;
  currentPlan?: PlanId;
  onSelect: (planId: PlanId) => void;
}

function formatPrice(price: number): string {
  if (price === 0) return "₩0";
  return `₩${price.toLocaleString("ko-KR")}`;
}

export default function PricingCard({
  planId,
  plan,
  currentPlan,
  onSelect,
}: PricingCardProps) {
  const isCurrent = currentPlan === planId;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isCurrent
          ? "border-blue-300 bg-blue-50/40"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{planId.toUpperCase()}</h3>
        {isCurrent && (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
            현재 플랜
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">
        {formatPrice(plan.price)}
        <span className="ml-1 text-sm font-medium text-gray-500">/월</span>
      </p>
      <div className="mt-4 space-y-1 text-sm text-gray-600">
        <p>
          Flash: <strong>{plan.flashLimit.toLocaleString("ko-KR")}건</strong>
        </p>
        <p>
          Pro: <strong>{plan.proLimit.toLocaleString("ko-KR")}건</strong>
        </p>
        <p>
          저장:{" "}
          <strong>
            {plan.storageLimit === null ? "무제한" : `${plan.storageLimit}개`}
          </strong>
        </p>
      </div>
      <button
        type="button"
        onClick={() => onSelect(planId)}
        className={`mt-5 w-full rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
          isCurrent
            ? "bg-gray-200 text-gray-500 cursor-default"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        disabled={isCurrent}
      >
        {isCurrent ? "이용 중" : "이 플랜 선택"}
      </button>
    </div>
  );
}
