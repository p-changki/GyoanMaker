"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import type { SummaryLanguage } from "@gyoanmaker/shared/types";

const OPTIONS: { value: SummaryLanguage; label: string }[] = [
  { value: "both", label: "영어 + 한국어" },
  { value: "en", label: "영어만" },
  { value: "ko", label: "한국어만" },
];

export default function SummaryLanguageSection() {
  const summaryLanguage = useTemplateSettingsStore((s) => s.summaryLanguage) ?? "both";
  const setSummaryLanguage = useTemplateSettingsStore((s) => s.setSummaryLanguage);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        요약 언어
      </p>
      <div className="flex gap-1.5">
        {OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSummaryLanguage(value)}
            className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
              summaryLanguage === value
                ? "border-[#5E35B1] bg-[#5E35B1] text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
