"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useWorkbookGenerator } from "@/app/workbook/_hooks/useWorkbookGenerator";

interface ModelQuotaView {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
}

interface QuotaStatusResponse {
  flash: ModelQuotaView;
  pro: ModelQuotaView;
}

interface WorkbookGenerateModalProps {
  onClose: () => void;
  onSaveAfterGenerate?: () => void;
}

export default function WorkbookGenerateModal({
  onClose,
  onSaveAfterGenerate,
}: WorkbookGenerateModalProps) {
  const selectedModel = useWorkbookStore((state) => state.selectedModel);
  const setSelectedModel = useWorkbookStore((state) => state.setSelectedModel);
  const isGenerating = useWorkbookStore((state) => state.isGenerating);
  const generateError = useWorkbookStore((state) => state.generateError);
  const setGenerateError = useWorkbookStore((state) => state.setGenerateError);
  const setIncludeInCompile = useWorkbookStore((state) => state.setIncludeInCompile);

  const router = useRouter();
  const { generate } = useWorkbookGenerator();
  const { status } = useSession();
  const { data: quota } = useQuery<QuotaStatusResponse>({
    queryKey: ["quota"],
    queryFn: async () => {
      const res = await fetch("/api/quota");
      if (!res.ok) throw new Error("Failed to fetch quota");
      return res.json();
    },
    staleTime: 30_000,
    enabled: status === "authenticated",
    retry: false,
  });

  // Clear error when modal opens
  useEffect(() => {
    setGenerateError(null);
  }, [setGenerateError]);

  const handleGenerate = async () => {
    const sections = useHandoutStore.getState().sections;
    const success = await generate(sections);
    if (success) {
      setIncludeInCompile(true);
      onSaveAfterGenerate?.();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 mx-4 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-black text-gray-900">워크북 생성</h2>
          <p className="mt-1 text-sm text-gray-500">
            파싱된 지문으로 STEP 1~3 워크북을 자동 생성합니다.
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI 모델</p>
          <div className="grid grid-cols-2 gap-3">
            {(["flash", "pro"] as const).map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => setSelectedModel(model)}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                  selectedModel === model
                    ? "border-[#5E35B1] bg-purple-50 text-[#5E35B1]"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {model === "flash" ? "⚡ 빠른 생성" : "✦ 정밀 생성"}
                <p className="mt-0.5 text-[10px] font-medium opacity-70">
                  {model === "flash" ? "빠름 · 경제적" : "정확 · 고품질"}
                </p>
                {quota && (
                  <p className={`mt-1 text-[10px] font-bold ${
                    quota[model].remaining <= 0 ? "text-red-400" : "opacity-50"
                  }`}>
                    잔여 {quota[model].remaining}/{quota[model].limit + quota[model].credits}회
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {generateError && !generateError.startsWith("QUOTA_EXCEEDED:") && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
            {generateError}
          </div>
        )}

        {/* Quota exceeded overlay */}
        {generateError?.startsWith("QUOTA_EXCEEDED:") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm p-6">
            <div className="text-center max-w-xs space-y-4">
              <div className="text-4xl">🚫</div>
              <h4 className="text-lg font-black text-gray-900">사용량 한도 초과</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                {generateError.slice("QUOTA_EXCEEDED:".length)}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setGenerateError(null); onClose(); }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/pricing")}
                  className="rounded-xl bg-[#5E35B1] px-5 py-2 text-sm font-bold text-white hover:bg-[#4527A0] transition-colors"
                >
                  플랜 업그레이드
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 rounded-xl bg-[#5E35B1] py-3 text-sm font-bold text-white hover:bg-[#4527A0] disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                생성 중...
              </span>
            ) : (
              "생성하기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
