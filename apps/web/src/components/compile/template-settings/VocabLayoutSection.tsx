"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import type { VocabColumnLayout } from "@gyoanmaker/shared/types";

const LAYOUTS: { value: VocabColumnLayout; label: string; desc: string }[] = [
  { value: 4, label: "4열", desc: "어휘 | 뜻 | 유의어 | 반의어" },
  { value: 3, label: "3열", desc: "어휘 | 뜻 | 유/반의어" },
  { value: 2, label: "2열", desc: "어휘+뜻 | 유/반의어" },
];

export default function VocabLayoutSection() {
  const vocabColumnLayout = useTemplateSettingsStore((s) => s.vocabColumnLayout) ?? 4;
  const setVocabColumnLayout = useTemplateSettingsStore((s) => s.setVocabColumnLayout);
  const vocabDisplay = useTemplateSettingsStore((s) => s.vocabDisplay);
  const setVocabDisplay = useTemplateSettingsStore((s) => s.setVocabDisplay);

  const showSynonyms = vocabDisplay?.showSynonyms ?? true;
  const showAntonyms = vocabDisplay?.showAntonyms ?? true;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          어휘 테이블 열
        </p>
        <div className="flex gap-1.5">
          {LAYOUTS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setVocabColumnLayout(value)}
              title={desc}
              className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${
                vocabColumnLayout === value
                  ? "border-[#5E35B1] bg-[#5E35B1] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          열 표시
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showSynonyms}
            onChange={(e) => setVocabDisplay({ showSynonyms: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-300 text-[#5E35B1] focus:ring-[#5E35B1]"
          />
          <span className="text-xs text-gray-700">유의어 표시</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAntonyms}
            onChange={(e) => setVocabDisplay({ showAntonyms: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-300 text-[#5E35B1] focus:ring-[#5E35B1]"
          />
          <span className="text-xs text-gray-700">반의어 표시</span>
        </label>
      </div>
    </div>
  );
}
