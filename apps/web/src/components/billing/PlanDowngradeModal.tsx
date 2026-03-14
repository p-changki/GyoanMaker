"use client";

import { type PlanId } from "@gyoanmaker/shared/plans";

interface PlanDowngradeModalProps {
  currentPlan: PlanId;
  targetPlan: PlanId;
  currentPeriodEndAt: string;
  onScheduled: () => void;
  onImmediate: () => void;
  onCancel: () => void;
}

function getRemainingDays(periodEndAt: string): number {
  const endMs = new Date(periodEndAt).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000)));
}

export default function PlanDowngradeModal({
  currentPlan,
  targetPlan,
  currentPeriodEndAt,
  onScheduled,
  onImmediate,
  onCancel,
}: PlanDowngradeModalProps) {
  const remainingDays = getRemainingDays(currentPeriodEndAt);
  const endDate = new Date(currentPeriodEndAt).toLocaleDateString("ko-KR");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900">플랜 변경 안내</h2>

        <p className="mt-3 text-sm text-gray-600">
          현재 <span className="font-semibold text-blue-600">{currentPlan.toUpperCase()}</span> 이용권이{" "}
          <span className="font-semibold text-amber-600">{remainingDays}일</span> 남았습니다.
          <br />
          <span className="text-xs text-gray-400">만료일: {endDate}</span>
        </p>

        <div className="mt-5 space-y-3">
          {/* Scheduled option (recommended) */}
          <button
            type="button"
            onClick={onScheduled}
            className="w-full rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-left transition-colors hover:bg-blue-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-blue-700">기간 종료 후 전환</span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">권장</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">
              현재 {currentPlan.toUpperCase()} 이용 기간이 끝난 후 {targetPlan.toUpperCase()}로 자동 전환됩니다.
              결제는 지금 처리되며, 플랜 적용만 예약됩니다.
            </p>
          </button>

          {/* Immediate option */}
          <button
            type="button"
            onClick={onImmediate}
            className="w-full rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
          >
            <span className="text-sm font-bold text-gray-700">지금 즉시 전환</span>
            <p className="mt-1 text-xs text-gray-600">
              {currentPlan.toUpperCase()} 잔여 기간({remainingDays}일)이 소멸되고 즉시 {targetPlan.toUpperCase()}로 전환됩니다.
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-lg py-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
