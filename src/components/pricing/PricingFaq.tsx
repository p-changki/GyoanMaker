"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "빠른 생성과 정밀 생성의 차이는 무엇인가요?",
    a: "빠른 생성은 지문당 5~10초로 빠르게 결과를 받을 수 있고, 정밀 생성은 30~60초가 걸리지만 더 높은 정확도를 제공합니다. 콘텐츠 난이도(상위권/기초)와 관계없이 선택한 생성 모드에 따라 이용 횟수가 차감됩니다.",
  },
  {
    q: "상위권 모드와 기초 모드는 이용 횟수에 영향을 주나요?",
    a: "아니요. 콘텐츠 난이도(상위권/기초)는 생성되는 어휘 수준만 달라지며, 이용 횟수 차감에는 영향을 주지 않습니다. 빠른 생성을 선택하면 빠른 생성 횟수가, 정밀 생성을 선택하면 정밀 생성 횟수가 차감됩니다.",
  },
  {
    q: "이용 횟수는 언제 초기화되나요?",
    a: "매월 1일 00:00 KST 기준으로 초기화됩니다. 사용하지 않은 횟수는 다음 달로 이월되지 않습니다.",
  },
  {
    q: "빠른 생성 횟수를 다 쓰면 정밀 생성만 가능한가요?",
    a: "네. 각 생성 모드의 이용 횟수는 독립적으로 관리됩니다. 한쪽이 소진되어도 다른 쪽은 남은 만큼 사용할 수 있습니다.",
  },
  {
    q: "충전 크레딧은 어떻게 차감되나요?",
    a: "월 기본 제공 횟수가 먼저 차감되고, 소진 후 충전 크레딧이 구매 순서대로 자동 차감됩니다. 충전 크레딧은 구매일로부터 90일간 유효합니다.",
  },
  {
    q: "Free 플랜의 제한 사항은?",
    a: "Free 플랜은 빠른 생성 10건, 정밀 생성 2건, 교안 저장 최대 3개까지 가능합니다. Basic 이상 플랜은 저장 무제한입니다.",
  },
];

const DEFAULT_VISIBLE = 3;

export default function PricingFaq() {
  const [expanded, setExpanded] = useState(false);
  const visibleFaqs = expanded ? FAQS : FAQS.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">자주 묻는 질문</h3>
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
          className="mt-4 w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {expanded ? "접기" : `더보기 (${FAQS.length - DEFAULT_VISIBLE})`}
        </button>
      )}
    </div>
  );
}
