"use client";

interface GenerateConfirmModalProps {
  passageCount: number;
  model: "flash" | "pro";
  onConfirm: () => void;
  onCancel: () => void;
}

const MODEL_LABEL: Record<string, string> = {
  pro: "Pro (정밀)",
  flash: "Flash (속도)",
};

export default function GenerateConfirmModal({
  passageCount,
  model,
  onConfirm,
  onCancel,
}: GenerateConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mx-auto">
          <svg className="h-6 w-6 text-[#5E35B1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>포켓보카 생성</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-gray-900">포켓보카 생성</h2>
          <p className="text-sm text-gray-500">
            AI가 핵심 어휘의 유의어·반의어를 생성합니다.
          </p>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">지문 수</span>
            <span className="font-semibold text-gray-900">{passageCount}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">사용 모델</span>
            <span className="font-semibold text-gray-900">{MODEL_LABEL[model] ?? model}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 text-xs text-gray-400">
            생성 시 <span className="font-semibold text-[#5E35B1]">{model === "pro" ? "Pro" : "Flash"} 크레딧</span>이 차감됩니다.
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#5E35B1] py-2.5 text-sm font-bold text-white transition hover:bg-[#4527A0]"
          >
            생성하기
          </button>
        </div>
      </div>
    </div>
  );
}
