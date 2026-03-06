"use client";

const FAQS = [
  {
    q: "쿼타는 언제 초기화되나요?",
    a: "모델별 월 쿼타는 매월 1일 00:00 KST 기준으로 초기화됩니다.",
  },
  {
    q: "충전 크레딧 사용 순서는 어떻게 되나요?",
    a: "구독 쿼타가 먼저 차감되고, 이후 충전 크레딧이 FIFO 순서로 자동 차감됩니다.",
  },
  {
    q: "Free 플랜 저장 제한은?",
    a: "Free는 최대 3개까지 저장 가능하며, Basic 이상은 저장 무제한입니다.",
  },
];

export default function PricingFaq() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900">자주 묻는 질문</h3>
      <div className="mt-4 space-y-4">
        {FAQS.map((item) => (
          <div key={item.q} className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-900">{item.q}</p>
            <p className="mt-1 text-sm text-gray-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
