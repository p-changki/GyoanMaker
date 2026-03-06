"use client";

import type { PlanDefinition, PlanId } from "@/lib/plans";

interface PricingCardProps {
  planId: PlanId;
  plan: PlanDefinition;
  currentPlan?: PlanId;
  recommended?: boolean;
  onSelect: (planId: PlanId) => void;
}

const PLAN_META: Record<
  PlanId,
  { label: string; description: string; features: string[] }
> = {
  free: {
    label: "Free",
    description: "서비스를 처음 체험해보는 분께 적합",
    features: [
      "빠른 생성 10건/월",
      "정밀 생성 2건/월",
      "교안 저장 최대 3개",
      "기본 PDF 내보내기",
    ],
  },
  basic: {
    label: "Basic",
    description: "소규모 학원·과외 선생님을 위한 플랜",
    features: [
      "빠른 생성 250건/월",
      "정밀 생성 30건/월",
      "교안 저장 무제한",
      "PDF 내보내기",
      "크레딧 충전 가능",
    ],
  },
  standard: {
    label: "Standard",
    description: "중규모 학원의 다과목 운영에 최적",
    features: [
      "빠른 생성 500건/월",
      "정밀 생성 120건/월",
      "교안 저장 무제한",
      "PDF 내보내기",
      "크레딧 충전 가능",
      "우선 생성 처리",
    ],
  },
  pro: {
    label: "Pro",
    description: "대형 학원·프랜차이즈의 대량 생성에 적합",
    features: [
      "빠른 생성 1,000건/월",
      "정밀 생성 400건/월",
      "교안 저장 무제한",
      "PDF 내보내기",
      "크레딧 충전 가능",
      "우선 생성 처리",
    ],
  },
};

function formatPrice(price: number): string {
  if (price === 0) return "0";
  return price.toLocaleString("ko-KR");
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PricingCard({
  planId,
  plan,
  currentPlan,
  recommended,
  onSelect,
}: PricingCardProps) {
  const isCurrent = currentPlan === planId;
  const meta = PLAN_META[planId];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        recommended
          ? "border-emerald-400 ring-1 ring-emerald-400/30"
          : "border-gray-200"
      }`}
    >
      {/* 추천 배지 */}
      {recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-sm">
            추천
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6 pt-7">
        {/* 플랜 이름 + 설명 */}
        <div className="text-center">
          <h3 className="text-lg font-extrabold text-gray-900">{meta.label}</h3>
          <p className="mt-1 text-sm text-gray-500">{meta.description}</p>
        </div>

        {/* 가격 */}
        <div className="mt-5 text-center">
          <p className="text-4xl font-extrabold tracking-tight text-gray-900">
            {formatPrice(plan.price)}
            <span className="ml-1 text-base font-medium text-gray-400">원</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {plan.price === 0 ? "무료" : "/월 (Vat 별도)"}
          </p>
        </div>

        {/* 구분선 */}
        <hr className="my-5 border-gray-100" />

        {/* 피처 리스트 */}
        <ul className="flex-1 space-y-2.5">
          {meta.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-gray-600"
            >
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* 현재 플랜 배지 */}
        {isCurrent && (
          <div className="mt-4 text-center">
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
              현재 이용 중
            </span>
          </div>
        )}

        {/* CTA 버튼 */}
        <button
          type="button"
          onClick={() => onSelect(planId)}
          className={`mt-5 w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
            isCurrent
              ? "border border-gray-200 bg-gray-50 text-gray-400 cursor-default"
              : recommended
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
          disabled={isCurrent}
        >
          {isCurrent ? "이용 중" : "이 플랜 선택"}
        </button>
      </div>
    </div>
  );
}
