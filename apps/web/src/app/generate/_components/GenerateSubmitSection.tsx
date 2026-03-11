"use client";

import { useState } from "react";
import type { PassageLimitError } from "@/lib/parsePassages";
import type { ContentLevel, ModelTier } from "@gyoanmaker/shared/types";
import QuotaIndicator from "@/components/QuotaIndicator";

interface GenerateSubmitSectionProps {
  passageCount: number;
  contentLevel: ContentLevel;
  modelTier: ModelTier;
  limitError: PassageLimitError | null;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const LEVEL_LABEL: Record<string, string> = {
  advanced: "심화 (B2~C1)",
  basic: "기본 (A2~B1)",
};

const MODEL_LABEL: Record<string, string> = {
  pro: "Pro (정밀)",
  flash: "Flash (속도)",
};

function GenerateConfirmModal({
  passageCount,
  contentLevel,
  modelTier,
  showPrecisionWarning,
  onConfirm,
  onCancel,
}: {
  passageCount: number;
  contentLevel: string;
  modelTier: string;
  showPrecisionWarning: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const estimateMin = Math.ceil(passageCount * 0.5);
  const estimateMax = passageCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto">
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <title>교안 생성</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-gray-900">교안 생성</h2>
          <p className="text-sm text-gray-500">AI가 교안을 자동 생성합니다.</p>
        </div>

        <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">지문 수</span>
            <span className="font-semibold text-gray-900">{passageCount}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">난이도</span>
            <span className="font-semibold text-gray-900">{LEVEL_LABEL[contentLevel] ?? contentLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">모델</span>
            <span className="font-semibold text-gray-900">{MODEL_LABEL[modelTier] ?? modelTier}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 text-xs text-gray-400">
            생성 시 <span className="font-semibold text-blue-600">{modelTier === "pro" ? "Pro" : "Flash"} 크레딧</span>이 차감됩니다.
          </div>
        </div>

        {showPrecisionWarning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 space-y-1">
            <p className="font-bold">⏱ 정밀 모드 소요 시간 안내</p>
            <p>지문당 30초~2분 소요 · 총 <strong>{estimateMin}~{estimateMax}분</strong> 예상</p>
            <p className="text-amber-500">빠른 결과가 필요하면 Speed 모드를 권장합니다.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            생성하기
          </button>
        </div>
      </div>
    </div>
  );
}

const PRECISION_WARNING_THRESHOLD = 3;

export default function GenerateSubmitSection({
  passageCount,
  contentLevel,
  modelTier,
  limitError,
  isSubmitDisabled,
  isSubmitting,
  onSubmit,
}: GenerateSubmitSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const needsWarning =
    contentLevel === "advanced" &&
    modelTier === "pro" &&
    passageCount >= PRECISION_WARNING_THRESHOLD;

  const handleClick = () => {
    setShowConfirm(true);
  };

  return (
    <>
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4">
        <div className="flex items-center gap-3 rounded-full border border-gray-200/50 bg-white/80 px-2 py-2 shadow-lg backdrop-blur-lg sm:gap-4 sm:px-3">
          {/* Quota */}
          <QuotaIndicator />

          {/* Errors */}
          {passageCount > 20 && (
            <span className="shrink-0 text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">
              최대 20개
            </span>
          )}
          {limitError && (
            <span className="shrink-0 text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full">
              {limitError.message}
            </span>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleClick}
            disabled={isSubmitDisabled || isSubmitting}
            className={
              isSubmitDisabled || isSubmitting
                ? "shrink-0 rounded-full px-10 py-3 text-base font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
                : "shrink-0 rounded-full px-10 py-3 text-base font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-200/50"
            }
          >
            {isSubmitting ? "생성 중..." : "생성"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <GenerateConfirmModal
          passageCount={passageCount}
          contentLevel={contentLevel}
          modelTier={modelTier}
          showPrecisionWarning={needsWarning}
          onConfirm={() => {
            setShowConfirm(false);
            onSubmit();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
