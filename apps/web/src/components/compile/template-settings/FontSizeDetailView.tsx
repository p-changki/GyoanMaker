"use client";

import { useState } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import {
  FONT_SIZE_PRESETS,
  FONT_SIZE_SLOT_META,
  FONT_SIZE_GROUPS,
} from "@gyoanmaker/shared/types";

interface FontSizeDetailViewProps {
  onBack: () => void;
}

export default function FontSizeDetailView({ onBack }: FontSizeDetailViewProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontScale = useTemplateSettingsStore((s) => s.fontScale);
  const adjustFontSizeSlot = useTemplateSettingsStore((s) => s.adjustFontSizeSlot);
  const setFontSizeSlot = useTemplateSettingsStore((s) => s.setFontSizeSlot);

  function renderSlots(keys: (keyof typeof FONT_SIZE_SLOT_META)[]) {
    return keys.map((key) => {
      const meta = FONT_SIZE_SLOT_META[key];
      const value = fontSizes[key];
      const presetValue = FONT_SIZE_PRESETS[fontScale][key];
      const isModified = value !== presetValue;
      return (
        <div key={key} className="flex items-center justify-between py-1 pl-4">
          <span className="text-[11px] text-gray-600">{meta.label}</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-mono w-14 text-right ${isModified ? "text-[#5E35B1] font-bold" : "text-gray-500"}`}>
              {value}{meta.unit}
            </span>
            <button type="button" onClick={() => adjustFontSizeSlot(key, "down")} disabled={value <= meta.min} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">-</button>
            <button type="button" onClick={() => adjustFontSizeSlot(key, "up")} disabled={value >= meta.max} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">+</button>
            {isModified && (
              <button type="button" onClick={() => setFontSizeSlot(key, presetValue)} className="w-6 h-6 flex items-center justify-center rounded text-xs text-gray-400 hover:text-[#5E35B1] transition-colors" title="프리셋 기본값으로 되돌리기">↺</button>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        설정으로 돌아가기
      </button>

      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        세부 크기 조정
      </p>

      {/* Section groups */}
      <div className="space-y-1">
        {FONT_SIZE_GROUPS.filter((g) => g.label !== "공통 UI").map((group) => {
          const isOpen = openGroup === group.label;
          const modifiedCount = group.keys.filter((k) => fontSizes[k] !== FONT_SIZE_PRESETS[fontScale][k]).length;
          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.label)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                  {group.label}
                </span>
                {modifiedCount > 0 && (
                  <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1.5 py-0.5 rounded-full">
                    {modifiedCount}
                  </span>
                )}
              </button>
              {isOpen && <div className="pb-2">{renderSlots(group.keys)}</div>}
            </div>
          );
        })}
      </div>

      {/* Common UI */}
      {(() => {
        const commonGroup = FONT_SIZE_GROUPS.find((g) => g.label === "공통 UI");
        if (!commonGroup) return null;
        const isOpen = openGroup === "공통 UI";
        const modifiedCount = commonGroup.keys.filter((k) => fontSizes[k] !== FONT_SIZE_PRESETS[fontScale][k]).length;
        return (
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setOpenGroup(isOpen ? null : "공통 UI")}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
                공통 UI
              </span>
              {modifiedCount > 0 && (
                <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1.5 py-0.5 rounded-full">
                  {modifiedCount}
                </span>
              )}
            </button>
            {isOpen && <div className="pb-2">{renderSlots(commonGroup.keys)}</div>}
          </div>
        );
      })()}
    </div>
  );
}
