"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "속도 모드와 정밀 모드의 차이는 무엇인가요?",
    a: "속도 생성은 지문당 5~10초로 빠른 결과를 제공합니다. 정밀 생성은 30~60초가 소요되지만 더 높은 정확도를 제공합니다. 사용량은 콘텐츠 난이도와 관계없이 선택한 생성 모드에 따라 차감됩니다.",
  },
  {
    q: "콘텐츠 난이도가 사용량에 영향을 미치나요?",
    a: "아닙니다. 난이도는 어휘 수준과 분석 깊이만 변경하며, 사용량은 생성 모드(속도/정밀)에 따라 차감됩니다.",
  },
  {
    q: "월간 사용량은 언제 초기화되나요?",
    a: "매월 1일 00:00 (KST)에 초기화됩니다. 미사용 할당량은 이월되지 않습니다.",
  },
  {
    q: "속도 사용량이 소진되면 정밀 모드를 사용할 수 있나요?",
    a: "네. 속도와 정밀은 별도의 할당량으로 관리됩니다.",
  },
  {
    q: "크레딧 충전은 어떻게 작동하나요?",
    a: "월간 할당량이 먼저 소비된 후 크레딧이 차감됩니다. 크레딧은 구매 후 90일간 유효합니다.",
  },
  {
    q: "무료 플랜의 제한사항은 무엇인가요?",
    a: "무료 플랜은 월 10회 속도 생성, 5회 정밀 생성, 5 일러스트 크레딧, 최대 3개 교안 저장이 가능합니다. 베이직 이상 플랜은 무제한 저장을 지원합니다.",
  },
  {
    q: "일러스트 크레딧은 무엇이며 어떻게 사용되나요?",
    a: "일러스트 크레딧은 교안에 AI 일러스트를 생성할 때 소비됩니다. 표준 품질 일러스트는 1크레딧, 고품질 일러스트는 2크레딧이 차감됩니다. 일러스트 크레딧은 속도/정밀 할당량과 별도로 관리됩니다.",
  },
  {
    q: "스타일 테스트와 일러스트 샘플은 무엇인가요?",
    a: "스타일 테스트는 일러스트 컨셉을 교안에 적용하기 전에 미리 확인할 수 있는 기능입니다. 각 플랜별로 일일 스타일 테스트 횟수가 정해져 있습니다 (예: 무료 3회/일, 스탠다드 10회/일). 일러스트 샘플은 저장하여 재사용할 수 있는 스타일로, 무료 플랜은 최대 10개, 스탠다드는 30개까지 저장 가능합니다.",
  },
  {
    q: "월 중에 플랜을 업그레이드/다운그레이드할 수 있나요?",
    a: "업그레이드는 즉시 적용되고, 다운그레이드는 현재 구독 기간 종료 후 적용됩니다.",
  },
  {
    q: "생성 중 오류가 발생하면 사용량이 차감되나요?",
    a: "아닙니다. 실패한 생성은 할당량에서 차감되지 않습니다. 일러스트는 성공한 건만 차감됩니다.",
  },
  {
    q: "여러 지문을 한 번에 생성할 수 있나요?",
    a: "네. 배치 생성이 가능하며, 각 지문이 1회로 계산됩니다.",
  },
  {
    q: "지문 길이에 제한이 있나요?",
    a: "지문당 최대 400단어, 배치당 최대 5,000단어입니다.",
  },
  {
    q: "유료 플랜의 '우선 처리'는 무엇인가요?",
    a: "스탠다드 및 프로 플랜은 피크 시간대에 처리 대기열에서 우선권을 받아 더 빠른 생성 속도를 제공합니다. 무료 및 베이직 플랜은 일반 대기열 우선순위가 적용됩니다.",
  },
];

const DEFAULT_VISIBLE = 3;

export default function PricingFaq() {
  const [expanded, setExpanded] = useState(false);
  const visibleFaqs = expanded ? FAQS : FAQS.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">
        자주 묻는 질문
      </h3>
      <div className="mt-4 space-y-4">
        {visibleFaqs.map((item) => (
          <div key={item.q} className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">{item.q}</p>
            <p className="mt-1 text-sm text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
      {FAQS.length > DEFAULT_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          {expanded ? "접기" : `더 보기 (${FAQS.length - DEFAULT_VISIBLE})`}
        </button>
      )}
    </div>
  );
}
