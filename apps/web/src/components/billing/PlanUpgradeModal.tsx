"use client";

import { type PlanId } from "@gyoanmaker/shared/plans";

interface PlanUpgradeModalProps {
  currentPlan: PlanId;
  targetPlan: PlanId;
  currentPeriodEndAt: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function getRemainingDays(periodEndAt: string): number {
  const endMs = new Date(periodEndAt).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000)));
}

export default function PlanUpgradeModal({
  currentPlan,
  targetPlan,
  currentPeriodEndAt,
  onConfirm,
  onCancel,
}: PlanUpgradeModalProps) {
  const remainingDays = getRemainingDays(currentPeriodEndAt);
  const endDate = new Date(currentPeriodEndAt).toLocaleDateString("ko-KR");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">플랜 업그레이드 안내</h2>

        <p className="mt-3 text-sm text-gray-600">
          현재 <span className="font-semibold text-blue-600">{currentPlan.toUpperCase()}</span> 이용권이{" "}
          <span className="font-semibold text-amber-600">{remainingDays}일</span> 남았습니다.
          <br />
          <span className="text-xs text-gray-400">만료일: {endDate}</span>
        </p>

        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-800">
            {targetPlan.toUpperCase()}로 업그레이드하면 현재 {currentPlan.toUpperCase()} 잔여 기간({remainingDays}일)이{" "}
            <span className="font-semibold">소멸</span>되고,{" "}
            {targetPlan.toUpperCase()} 30일이 새로 시작됩니다.
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            업그레이드 진행
          </button>
        </div>
      </div>
    </div>
  );
}
