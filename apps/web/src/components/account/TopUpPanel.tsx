"use client";

import { TOP_UP_PACKAGES, MODEL_DISPLAY_NAMES } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

export default function TopUpPanel() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-900">크레딧 충전</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {TOP_UP_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-xl border border-gray-100 bg-gray-50 p-4"
          >
            <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
            <p className="mt-1 text-sm text-gray-600">
              {MODEL_DISPLAY_NAMES[pkg.type]} {pkg.amount} 크레딧
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
  );
}
