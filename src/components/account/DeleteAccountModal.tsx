"use client";

import { useState } from "react";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const CONFIRM_TEXT = "탈퇴합니다";

export default function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [input, setInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open) return null;

  const canConfirm = input.trim() === CONFIRM_TEXT;

  async function handleConfirm() {
    if (!canConfirm || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-5 w-5 text-red-600"
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
            <h3 className="text-base font-bold text-gray-900">계정 탈퇴</h3>
            <p className="mt-1 text-sm text-gray-500">
              탈퇴하면 모든 데이터가 영구 삭제되며 복구할 수 없습니다.
            </p>
          </div>
        </div>

        {/* Deleted items */}
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          <ul className="list-inside list-disc space-y-1">
            <li>저장된 교안 전체 삭제</li>
            <li>사용 내역 및 크레딧 삭제</li>
            <li>계정 정보 영구 삭제</li>
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            확인을 위해{" "}
            <span className="font-bold text-red-600">{CONFIRM_TEXT}</span>를
            입력해주세요
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
            placeholder={CONFIRM_TEXT}
            disabled={isDeleting}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isDeleting}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isDeleting ? "삭제 중..." : "계정 탈퇴"}
          </button>
        </div>
      </div>
    </div>
  );
}
