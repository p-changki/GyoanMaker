"use client";

import Link from "next/link";

interface DuplicateHandout {
  id: string;
  title: string;
  passageCount: number;
  createdAt: string;
}

interface DuplicateWarningModalProps {
  open: boolean;
  duplicates: DuplicateHandout[];
  onClose: () => void;
  onProceed: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DuplicateWarningModal({
  open,
  duplicates,
  onClose,
  onProceed,
}: DuplicateWarningModalProps) {
  if (!open || duplicates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-5 w-5 text-amber-600"
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
              이미 생성된 교안이 있습니다
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              동일한 지문으로 생성된 교안이 있어요. 다시 생성하면 이용 횟수가
              차감됩니다.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {duplicates.map((d) => (
            <Link
              key={d.id}
              href={`/compile?handoutId=${d.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-3 text-sm hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{d.title}</p>
                <p className="text-xs text-gray-400">
                  {d.passageCount}개 지문 · {formatDate(d.createdAt)}
                </p>
              </div>
              <span className="ml-3 shrink-0 text-xs font-bold text-blue-600">
                열기
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition-colors"
          >
            그래도 생성
          </button>
        </div>
      </div>
    </div>
  );
}
