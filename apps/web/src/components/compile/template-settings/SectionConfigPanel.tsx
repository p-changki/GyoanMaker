"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { PAGE2_SECTION_LABELS } from "@gyoanmaker/shared/types";
import { ALL_SECTIONS } from "./constants";

export default function SectionConfigPanel() {
  const page2Sections = useTemplateSettingsStore((s) => s.page2Sections);
  const toggleSection = useTemplateSettingsStore((s) => s.toggleSection);
  const moveSection = useTemplateSettingsStore((s) => s.moveSection);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        Page 2 섹션
      </p>
      <div className="space-y-1">
        {ALL_SECTIONS.map((key) => {
          const isActive = page2Sections.includes(key);
          const orderIdx = page2Sections.indexOf(key);
          return (
            <div
              key={key}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white transition-colors"
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleSection(key)}
                  className="rounded border-gray-300 text-[#5E35B1] focus:ring-[#5E35B1] w-3.5 h-3.5"
                />
                <span className={`text-xs font-medium ${isActive ? "text-gray-700" : "text-gray-400 line-through"}`}>
                  {PAGE2_SECTION_LABELS[key]}
                </span>
              </label>
              {isActive && (
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveSection(key, "up")}
                    disabled={orderIdx === 0}
                    className="p-1 text-gray-400 hover:text-[#5E35B1] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(key, "down")}
                    disabled={orderIdx === page2Sections.length - 1}
                    className="p-1 text-gray-400 hover:text-[#5E35B1] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
