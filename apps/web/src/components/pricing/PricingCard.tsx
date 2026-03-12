"use client";

import { useState } from "react";
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

interface FeatureItem {
  label: string;
  tooltip?: string;
}

interface FeatureGroup {
  category: string;
  items: FeatureItem[];
}

interface BookEstimate {
  precision: string;
  speed: string;
}

interface PlanMeta {
  label: string;
  description: string;
  bookEstimate?: BookEstimate;
  features: FeatureGroup[];
}

const PLAN_META: Record<PlanId, PlanMeta> = {
  free: {
    label: "무료",
    description: "서비스를 체험해 보세요",
    features: [
      {
        category: "교안 · 워크북 생성",
        items: [
          { label: "속도 모드 지문 20개 / 월", tooltip: "지문당 10~20초" },
          { label: "정밀 모드 지문 5개 / 월", tooltip: "지문당 30초~2분, 최고 품질" },
          { label: "교안당 최대 20개 지문", tooltip: "교안 1개에 최대 20개 지문 포함" },
          { label: "워크북 자동 생성", tooltip: "교안 할당량을 공유하여 차감됩니다 (지문 1개 = 1회)" },
        ],
      },
      {
        category: "일러스트",
        items: [
          { label: "교안 일러스트 삽입 3회 / 월", tooltip: "교안에 AI 일러스트 추가" },
          { label: "일러스트 샘플 저장 10개", tooltip: "마음에 드는 화풍을 저장" },
          { label: "일러스트 미리보기 3회 / 일", tooltip: "화풍을 미리 테스트" },
        ],
      },
      {
        category: "저장 & 내보내기",
        items: [
          { label: "교안 저장 최대 3개" },
          { label: "PDF 다운로드" },
          { label: "단어 테스트 생성", tooltip: "교안 어휘로 유의어 5지선다 시험지 자동 생성" },
          { label: "포켓보카 생성", tooltip: "핵심 어휘 유의어·반의어 암기 시트 자동 생성" },
          { label: "강의 슬라이드(PPT)", tooltip: "교안 데이터로 강의용 PPT 슬라이드 자동 생성" },
        ],
      },
    ],
  },
  basic: {
    label: "베이직",
    description: "개인 과외 · 소규모 학원용",
    bookEstimate: { precision: "5권", speed: "15권" },
    features: [
      {
        category: "교안 · 워크북 생성",
        items: [
          { label: "속도 모드 지문 300개 / 월", tooltip: "지문당 10~20초" },
          { label: "정밀 모드 지문 100개 / 월", tooltip: "지문당 30초~2분, 최고 품질" },
          { label: "교안당 최대 20개 지문", tooltip: "교안 1개에 최대 20개 지문 포함" },
          { label: "워크북 자동 생성", tooltip: "교안 할당량을 공유하여 차감됩니다 (지문 1개 = 1회)" },
        ],
      },
      {
        category: "일러스트",
        items: [
          { label: "교안 일러스트 삽입 20회 / 월", tooltip: "교안에 AI 일러스트 추가" },
          { label: "일러스트 샘플 저장 20개", tooltip: "마음에 드는 화풍을 저장" },
          { label: "일러스트 미리보기 5회 / 일", tooltip: "화풍을 미리 테스트" },
          { label: "추가 일러스트 팩 구매", tooltip: "초과 시 일러스트 크레딧으로 추가 생성" },
        ],
      },
      {
        category: "저장 & 내보내기",
        items: [
          { label: "무제한 저장" },
          { label: "PDF 다운로드" },
          { label: "단어 테스트 생성", tooltip: "교안 어휘로 유의어 5지선다 시험지 자동 생성" },
          { label: "포켓보카 생성", tooltip: "핵심 어휘 유의어·반의어 암기 시트 자동 생성" },
          { label: "추가 크레딧 구매", tooltip: "사용량 초과 시 크레딧으로 추가 생성" },
        ],
      },
    ],
  },
  standard: {
    label: "스탠다드",
    description: "중형 학원용",
    bookEstimate: { precision: "10권", speed: "40권" },
    features: [
      {
        category: "교안 · 워크북 생성",
        items: [
          { label: "속도 모드 지문 800개 / 월", tooltip: "지문당 10~20초" },
          { label: "정밀 모드 지문 200개 / 월", tooltip: "지문당 30초~2분, 최고 품질" },
          { label: "교안당 최대 20개 지문", tooltip: "교안 1개에 최대 20개 지문 포함" },
          { label: "워크북 자동 생성", tooltip: "교안 할당량을 공유하여 차감됩니다 (지문 1개 = 1회)" },
        ],
      },
      {
        category: "일러스트",
        items: [
          { label: "교안 일러스트 삽입 50회 / 월", tooltip: "교안에 AI 일러스트 추가" },
          { label: "일러스트 샘플 저장 30개", tooltip: "마음에 드는 화풍을 저장" },
          { label: "일러스트 미리보기 10회 / 일", tooltip: "화풍을 미리 테스트" },
          { label: "추가 일러스트 팩 구매", tooltip: "초과 시 일러스트 크레딧으로 추가 생성" },
        ],
      },
      {
        category: "저장 & 내보내기",
        items: [
          { label: "무제한 저장" },
          { label: "PDF 다운로드" },
          { label: "단어 테스트 생성", tooltip: "교안 어휘로 유의어 5지선다 시험지 자동 생성" },
          { label: "포켓보카 생성", tooltip: "핵심 어휘 유의어·반의어 암기 시트 자동 생성" },
          { label: "추가 크레딧 구매", tooltip: "사용량 초과 시 크레딧으로 추가 생성" },
          { label: "우선 처리", tooltip: "생성 요청이 우선 큐에서 처리" },
        ],
      },
    ],
  },
  pro: {
    label: "프로",
    description: "대형 학원 · 프랜차이즈용",
    bookEstimate: { precision: "20권", speed: "100권" },
    features: [
      {
        category: "교안 · 워크북 생성",
        items: [
          { label: "속도 모드 지문 2,000개 / 월", tooltip: "지문당 10~20초" },
          { label: "정밀 모드 지문 400개 / 월", tooltip: "지문당 30초~2분, 최고 품질" },
          { label: "교안당 최대 20개 지문", tooltip: "교안 1개에 최대 20개 지문 포함" },
          { label: "워크북 자동 생성", tooltip: "교안 할당량을 공유하여 차감됩니다 (지문 1개 = 1회)" },
        ],
      },
      {
        category: "일러스트",
        items: [
          { label: "교안 일러스트 삽입 100회 / 월", tooltip: "교안에 AI 일러스트 추가" },
          { label: "일러스트 샘플 저장 30개", tooltip: "마음에 드는 화풍을 저장" },
          { label: "일러스트 미리보기 10회 / 일", tooltip: "화풍을 미리 테스트" },
          { label: "추가 일러스트 팩 구매", tooltip: "초과 시 일러스트 크레딧으로 추가 생성" },
        ],
      },
      {
        category: "저장 & 내보내기",
        items: [
          { label: "무제한 저장" },
          { label: "PDF 다운로드" },
          { label: "단어 테스트 생성", tooltip: "교안 어휘로 유의어 5지선다 시험지 자동 생성" },
          { label: "포켓보카 생성", tooltip: "핵심 어휘 유의어·반의어 암기 시트 자동 생성" },
          { label: "추가 크레딧 구매", tooltip: "사용량 초과 시 크레딧으로 추가 생성" },
          { label: "우선 처리", tooltip: "생성 요청이 우선 큐에서 처리" },
        ],
      },
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

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative ml-0.5 inline-flex cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <svg
        className="h-3 w-3 text-gray-300 hover:text-gray-500 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <title>도움말</title>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
      </svg>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg">
          {text}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
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
              <span className="text-xs font-medium text-gray-400">/30일</span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] text-gray-400">
          {plan.price === 0 ? "신용카드 불필요" : "VAT 별도"}
        </p>

        {/* Features */}
        <div className="mt-5 flex flex-col gap-3 text-left">
          {meta.features.map((group) => (
            <div key={group.category}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.category}
              </p>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-1.5">
                    <CheckIcon />
                    <span className="text-xs text-gray-600">{item.label}</span>
                    {item.tooltip && <Tooltip text={item.tooltip} />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

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

        {meta.bookEstimate && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              정밀 모드 {meta.bookEstimate.precision}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
              속도 모드 {meta.bookEstimate.speed}
            </span>
          </div>
        )}
        <p className="mt-2 text-[11px] leading-4 text-gray-400">
          {meta.description}
        </p>
      </div>
    </div>
  );
}
