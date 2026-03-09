"use client";

interface DailyLimitModalProps {
  dailyUsage: { used: number; limit: number } | null;
  onClose: () => void;
}

export default function DailyLimitModal({ dailyUsage, onClose }: DailyLimitModalProps) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-7 w-7 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2">일일 테스트 한도 초과</h2>
        <p className="text-sm text-gray-500 mb-1">
          오늘의 일러스트 테스트 생성 한도({dailyUsage?.limit ?? 10}회)를 모두 사용했습니다.
        </p>
        <p className="text-xs text-gray-400 mb-5">
          매일 자정(KST)에 초기화됩니다.
        </p>
        {dailyUsage && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>사용량</span>
              <span className="font-bold">{dailyUsage.used} / {dailyUsage.limit}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white hover:bg-gray-800 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}
