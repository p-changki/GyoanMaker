"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useVocabBankStore } from "@/stores/useVocabBankStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useVocabBankGenerator } from "@/app/compile/_hooks/useVocabBankGenerator";

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

interface VocabBankGenerateModalProps {
  onClose: () => void;
  onSaveAfterGenerate?: () => void;
}

export default function VocabBankGenerateModal({
  onClose,
  onSaveAfterGenerate,
}: VocabBankGenerateModalProps) {
  const handoutModel = useHandoutStore((state) => state.handoutModel);
  const isGenerating = useVocabBankStore((state) => state.isGenerating);
  const generateError = useVocabBankStore((state) => state.generateError);
  const setGenerateError = useVocabBankStore((state) => state.setGenerateError);
  const setIncludeInCompile = useVocabBankStore(
    (state) => state.setIncludeInCompile
  );

  const router = useRouter();
  const { generate } = useVocabBankGenerator();
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

  const modelLabel = handoutModel === "flash" ? "빠른 생성" : "정밀 생성";
  const modelIcon = handoutModel === "flash" ? "⚡" : "✦";
  const modelQuota = quota?.[handoutModel];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 mx-4 space-y-6">
        <div>
          <h2 className="text-xl font-black text-gray-900">보카 생성</h2>
          <p className="mt-1 text-sm text-gray-500">
            파싱된 지문 전체를 통합 분석해 보카 뱅크를 생성합니다.
          </p>
        </div>

        <div className="rounded-xl border-2 border-[#5E35B1] bg-purple-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#5E35B1]">
                {modelIcon} {modelLabel}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-[#5E35B1]/70">
                교안 생성 모델과 동일
              </p>
            </div>
            {modelQuota && (
              <p
                className={`text-[10px] font-bold ${
                  modelQuota.remaining <= 0
                    ? "text-red-400"
                    : "text-[#5E35B1]/50"
                }`}
              >
                잔여 {modelQuota.remaining}/
                {modelQuota.limit + modelQuota.credits}회
              </p>
            )}
          </div>
        </div>

        {generateError && !generateError.startsWith("QUOTA_EXCEEDED:") && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
            {generateError}
          </div>
        )}

        {generateError?.startsWith("QUOTA_EXCEEDED:") && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm p-6">
            <div className="text-center max-w-xs space-y-4">
              <div className="text-4xl">🚫</div>
              <h4 className="text-lg font-black text-gray-900">
                사용량 한도 초과
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                {generateError.slice("QUOTA_EXCEEDED:".length)}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGenerateError(null);
                    onClose();
                  }}
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
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
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
