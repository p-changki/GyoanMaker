"use client";

import { useState } from "react";

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  periodEndAt: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CancelSubscriptionModal({
  open,
  onClose,
  onConfirm,
  periodEndAt,
}: CancelSubscriptionModalProps) {
  const [isCanceling, setIsCanceling] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    if (isCanceling) return;
    setIsCanceling(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setIsCanceling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-5 w-5 text-yellow-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              구독 해지
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              구독을 해지하시겠습니까?
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
          <ul className="list-inside list-disc space-y-1">
            <li>
              {periodEndAt
                ? `현재 결제 기간(~${formatDate(periodEndAt)})까지 서비스를 계속 이용할 수 있습니다`
                : "현재 결제 기간 종료 시까지 서비스를 계속 이용할 수 있습니다"}
            </li>
            <li>이후 자동으로 Free 플랜으로 전환됩니다</li>
            <li>저장된 교안과 데이터는 유지됩니다</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isCanceling}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isCanceling}
            className="flex-1 rounded-xl bg-yellow-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isCanceling ? "처리 중..." : "해지"}
          </button>
        </div>
      </div>
    </div>
  );
}
