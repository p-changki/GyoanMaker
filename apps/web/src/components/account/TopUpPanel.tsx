"use client";

import { TOP_UP_PACKAGES, type TopUpPackageId } from "@gyoanmaker/shared/plans";

interface TopUpPanelProps {
  onSelectPackage: (packageId: TopUpPackageId) => void;
}

export default function TopUpPanel({ onSelectPackage }: TopUpPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-gray-900">종량 충전</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {TOP_UP_PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-xl border border-gray-100 bg-gray-50 p-4"
          >
            <p className="text-sm font-semibold text-gray-900">{pkg.id}</p>
            <p className="mt-1 text-sm text-gray-600">
              {pkg.type.toUpperCase()} {pkg.amount}건
            </p>
            <p className="mt-1 text-base font-bold text-gray-900">
              ₩{pkg.price.toLocaleString("ko-KR")}
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
              onClick={() => onSelectPackage(pkg.id)}
            >
              충전하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
