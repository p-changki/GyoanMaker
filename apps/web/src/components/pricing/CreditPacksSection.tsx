"use client";

import Link from "next/link";

const ILLUSTRATION_PACKS = [
  { label: "20장", price: 3_900, description: "교재 1권분 삽화" },
  { label: "50장", price: 8_900, description: "교재 2~3권분 삽화" },
  { label: "100장", price: 15_900, description: "교재 5권분 삽화" },
];

const LESSON_PACKS = [
  { label: "교재 1권 팩", price: 5_900, description: "정밀 20회" },
  { label: "교재 3권 팩", price: 15_900, description: "정밀 60회" },
  { label: "속도 팩", price: 2_900, description: "속도 100회" },
];

export default function CreditPacksSection() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          추가 크레딧 팩
        </h2>
        <p className="text-sm text-gray-500">
          월간 할당량이 부족할 때 필요한 만큼 추가 구매하세요.
          <br className="hidden sm:block" />
          베이직 이상 플랜에서 구매 가능 · 90일 유효 · VAT 별도
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Illustration packs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">일러스트 추가 팩</h3>
          <p className="mt-1 text-xs text-gray-400">
            기본 포함량 초과 시 추가 구매
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {ILLUSTRATION_PACKS.map((pack) => (
              <div
                key={pack.label}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {pack.label}
                </p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  ₩{pack.price.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {pack.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Lesson credit packs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">교안 크레딧 팩</h3>
          <p className="mt-1 text-xs text-gray-400">
            월간 지문 생성 할당량 추가
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {LESSON_PACKS.map((pack) => (
              <div
                key={pack.label}
                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center"
              >
                <p className="text-sm font-semibold text-gray-900">
                  {pack.label}
                </p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  ₩{pack.price.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {pack.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/billing?tab=topup"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800"
        >
          크레딧 충전하기
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
