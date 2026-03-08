"use client";

interface GenerationResult {
  imageUrl: string;
  storagePath: string;
  prompt: string;
  model: string;
  scene: string;
  quality: string;
  aspectRatio: string;
}

interface GenerationResultPanelProps {
  result: GenerationResult;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}

export default function GenerationResultPanel({
  result,
  onSave,
  onDiscard,
  isSaving,
}: GenerationResultPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1">
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.imageUrl}
              alt="Generated illustration"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 md:w-64">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">생성 결과</h3>
            <p className="text-xs text-gray-500">Model: {result.model}</p>
            <p className="line-clamp-4 text-xs text-gray-600">
              {result.prompt}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              버리기
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-[#5E35B1] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#4527A0] disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "갤러리에 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
