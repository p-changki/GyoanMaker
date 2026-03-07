"use client";

import type { PassageLimitError } from "@/lib/parsePassages";
import QuotaIndicator from "@/components/QuotaIndicator";

interface GenerateSubmitSectionProps {
  passageCount: number;
  limitError: PassageLimitError | null;
  isSubmitDisabled: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function GenerateSubmitSection({
  passageCount,
  limitError,
  isSubmitDisabled,
  isSubmitting,
  onSubmit,
}: GenerateSubmitSectionProps) {
  return (
    <>
      <QuotaIndicator />

      <div className="flex flex-col items-center space-y-6 pt-8">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled || isSubmitting}
          className={`w-full md:w-80 py-5 rounded-2xl text-xl font-black transition-all shadow-xl ${
            isSubmitDisabled || isSubmitting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.97] shadow-blue-200"
          }`}
        >
          {isSubmitting ? "Generating..." : "Generate Handout"}
        </button>
        {passageCount > 20 && (
          <p className="text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full">
            Maximum 20 passages allowed.
          </p>
        )}
        {limitError && (
          <p className="text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-xl text-center">
            {limitError.message}
          </p>
        )}
      </div>
    </>
  );
}
