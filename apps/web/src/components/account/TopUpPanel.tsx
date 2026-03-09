"use client";

import { TOP_UP_PACKAGES, type TopUpCreditType } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

const CREDIT_TYPE_LABELS: Record<TopUpCreditType, string> = {
  flash: "속도",
  pro: "정밀",
  illustration: "일러스트",
};

const ILLUSTRATION_PACKAGES = TOP_UP_PACKAGES.filter((pkg) => pkg.type === "illustration");
const LESSON_PACKAGES = TOP_UP_PACKAGES.filter((pkg) => pkg.type === "pro" || pkg.type === "flash");

export default function TopUpPanel() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-900">크레딧 충전</h3>
      <p className="mt-1 text-xs text-gray-400">90일 유효 · VAT 별도</p>

      {/* Illustration packs */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          일러스트 추가 팩
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {ILLUSTRATION_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
              <p className="mt-1 text-base font-bold text-gray-900">
                ₩{pkg.price.toLocaleString()}
              </p>
              <div className="mt-3">
                <TossPaymentButton
                  type="topup"
                  packageId={pkg.id}
                  label="충전하기"
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lesson credit packs */}
      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          교안 크레딧 팩
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {LESSON_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
              <p className="mt-1 text-xs text-gray-500">
                {CREDIT_TYPE_LABELS[pkg.type]} {pkg.amount}회
              </p>
              <p className="mt-1 text-base font-bold text-gray-900">
                ₩{pkg.price.toLocaleString()}
              </p>
              <div className="mt-3">
                <TossPaymentButton
                  type="topup"
                  packageId={pkg.id}
                  label="충전하기"
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
