"use client";

import { cn } from "@/lib/cn";
import type { PlanDefinition, PlanId } from "@gyoanmaker/shared/plans";

interface PricingCardProps {
  planId: PlanId;
  plan: PlanDefinition;
  currentPlan?: PlanId;
  recommended?: boolean;
  onSelect: (planId: PlanId) => void;
  index: number;
  totalPlans: number;
}

const PLAN_META: Record<
  PlanId,
  { label: string; description: string; features: string[] }
> = {
  free: {
    label: "무료",
    description: "서비스를 체험해 보세요",
    features: [
      "10 속도 생성 / 월",
      "5 정밀 생성 / 월",
      "5 삽화 크레딧 / 월",
      "10 삽화 샘플",
      "3 스타일 테스트 / 일",
      "최대 3개 교안",
      "기본 PDF 내보내기",
    ],
  },
  basic: {
    label: "베이직",
    description: "개인 과외·소규모 학원용",
    features: [
      "250 속도 생성 / 월",
      "30 정밀 생성 / 월",
      "10 삽화 크레딧 / 월",
      "20 삽화 샘플",
      "5 스타일 테스트 / 일",
      "무제한 저장",
      "PDF 내보내기",
      "크레딧 충전",
    ],
  },
  standard: {
    label: "스탠다드",
    description: "중형 학원용",
    features: [
      "500 속도 생성 / 월",
      "120 정밀 생성 / 월",
      "30 삽화 크레딧 / 월",
      "30 삽화 샘플",
      "10 스타일 테스트 / 일",
      "무제한 저장",
      "PDF 내보내기",
      "크레딧 충전",
      "우선 처리",
    ],
  },
  pro: {
    label: "프로",
    description: "대형 학원·프랜차이즈용",
    features: [
      "1,000 속도 생성 / 월",
      "400 정밀 생성 / 월",
      "60 삽화 크레딧 / 월",
      "30 삽화 샘플",
      "10 스타일 테스트 / 일",
      "무제한 저장",
      "PDF 내보내기",
      "크레딧 충전",
      "우선 처리",
    ],
  },
};

function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return price.toLocaleString("ko-KR");
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600"
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
  index,
  totalPlans,
}: PricingCardProps) {
  const isCurrent = currentPlan === planId;
  const meta = PLAN_META[planId];
  const isEdge = index === 0 || index === totalPlans - 1;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-5 text-center shadow-sm transition-shadow duration-200 hover:shadow-md",
        recommended ? "border-blue-600 border-2 z-10" : "border-gray-200",
        isEdge && "lg:scale-[0.98]",
        !recommended && "mt-0 md:mt-4"
      )}
    >
      {/* Popular badge */}
      {recommended && (
        <div className="absolute right-0 top-0 flex items-center rounded-bl-xl rounded-tr-xl bg-blue-600 px-2.5 py-0.5">
          <svg
            className="h-3.5 w-3.5 fill-current text-white"
            viewBox="0 0 24 24"
          >
            <title>인기</title>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="ml-1 text-xs font-semibold text-white">
            인기
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Plan name */}
        <p className="text-sm font-semibold text-gray-500">{meta.label}</p>

        {/* Price */}
        <div className="mt-4 flex items-baseline justify-center gap-1">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              무료
            </span>
          ) : (
            <>
              <span className="text-xs font-medium text-gray-400">₩</span>
              <span className="text-3xl font-bold tracking-tight text-gray-900">
                {formatPrice(plan.price)}
              </span>
              <span className="text-xs font-medium text-gray-400">/월</span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] text-gray-400">
          {plan.price === 0 ? "신용카드 불필요" : "VAT 별도"}
        </p>

        {/* Features */}
        <ul className="mt-5 flex flex-col gap-2">
          {meta.features.map((feature) => (
            <li key={feature} className="flex items-start gap-1.5 text-left">
              <CheckIcon />
              <span className="text-xs text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        <hr className="my-4 border-gray-100" />

        {/* Current plan badge */}
        {isCurrent && (
          <div className="mb-2 text-center">
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600">
              현재 플랜
            </span>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => onSelect(planId)}
          disabled={isCurrent}
          className={cn(
            "mt-auto w-full rounded-xl py-2.5 text-sm font-bold transition-[background-color,color,box-shadow,border-color]",
            isCurrent
              ? "cursor-default border border-gray-200 bg-gray-50 text-gray-400"
              : recommended
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:ring-2 hover:ring-blue-600 hover:ring-offset-1"
                : "bg-gray-900 text-white hover:bg-gray-800 hover:ring-2 hover:ring-gray-900 hover:ring-offset-1"
          )}
        >
          {isCurrent ? "현재 플랜" : "시작하기"}
        </button>

        <p className="mt-3 text-[11px] leading-4 text-gray-400">
          {meta.description}
        </p>
      </div>
    </div>
  );
}
