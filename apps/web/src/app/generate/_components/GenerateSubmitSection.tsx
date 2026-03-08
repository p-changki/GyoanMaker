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

function PrecisionWarningModal({
  passageCount,
  onConfirm,
  onCancel,
}: {
  passageCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const estimateMin = Math.ceil(passageCount * 0.5);
  const estimateMax = passageCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Warning</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Precision Mode Notice</h3>
            <p className="mt-0.5 text-xs text-gray-500">Advanced + Precision</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p>
            <strong>{passageCount}개 지문</strong>을 Precision 모드로 생성하면
            지문당 30~60초가 소요되어 총
            <strong className="text-amber-700"> {estimateMin}~{estimateMax}분</strong>이
            걸릴 수 있습니다.
          </p>
          <p className="text-xs text-gray-400">
            빠른 결과가 필요하면 Speed 모드를 권장합니다.
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Continue
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
  const [showWarning, setShowWarning] = useState(false);

  const needsWarning =
    contentLevel === "advanced" &&
    modelTier === "pro" &&
    passageCount >= PRECISION_WARNING_THRESHOLD;

  const handleClick = () => {
    if (needsWarning) {
      setShowWarning(true);
    } else {
      onSubmit();
    }
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
              Max 20
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
            {isSubmitting ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {showWarning && (
        <PrecisionWarningModal
          passageCount={passageCount}
          onConfirm={() => {
            setShowWarning(false);
            onSubmit();
          }}
          onCancel={() => setShowWarning(false)}
        />
      )}
    </>
  );
}
