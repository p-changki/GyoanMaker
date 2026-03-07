"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import {
  FONT_FAMILY_MAP,
  TITLE_WEIGHT_MAP,
  FONT_SIZE_PRESETS,
  FONT_SIZE_GROUPS,
} from "@gyoanmaker/shared/types";
import type { FontFamily } from "@gyoanmaker/shared/types";
import { FONT_SCALE_OPTIONS, TITLE_WEIGHT_KEYS } from "./constants";

interface FontSettingsSectionProps {
  onOpenDetail: () => void;
}

export default function FontSettingsSection({ onOpenDetail }: FontSettingsSectionProps) {
  const fontScale = useTemplateSettingsStore((s) => s.fontScale);
  const setFontScale = useTemplateSettingsStore((s) => s.setFontScale);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const setFontFamily = useTemplateSettingsStore((s) => s.setFontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const setTitleWeight = useTemplateSettingsStore((s) => s.setTitleWeight);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);

  const totalModified = FONT_SIZE_GROUPS.flatMap((g) => g.keys).filter(
    (k) => fontSizes[k] !== FONT_SIZE_PRESETS[fontScale][k],
  ).length;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        폰트 설정
      </p>

      {/* Font Scale */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">크기</label>
        <div className="flex gap-1">
          {FONT_SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFontScale(opt.key)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium border-2 transition-all ${
                fontScale === opt.key
                  ? "border-gray-800 bg-white shadow-sm text-gray-800"
                  : "border-transparent bg-white/60 text-gray-500 hover:border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size Detail trigger */}
      <button
        type="button"
        onClick={onOpenDetail}
        className="w-full flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200 hover:border-[#5E35B1] transition-colors bg-white"
      >
        <span className="text-[10px] text-gray-600 font-medium">세부 크기 조정</span>
        <span className="flex items-center gap-1.5">
          {totalModified > 0 && (
            <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1.5 py-0.5 rounded-full">
              {totalModified}개 수정
            </span>
          )}
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>

      {/* Font Family */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">폰트</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value as FontFamily)}
          className="w-full py-2 px-3 rounded-lg border-2 border-gray-200 bg-white text-xs text-gray-700 focus:border-gray-800 focus:outline-none transition-colors appearance-none cursor-pointer"
          style={{ fontFamily: FONT_FAMILY_MAP[fontFamily].css }}
        >
          {(Object.keys(FONT_FAMILY_MAP) as FontFamily[]).map((key) => (
            <option key={key} value={key} style={{ fontFamily: FONT_FAMILY_MAP[key].css }}>
              {FONT_FAMILY_MAP[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Title Weight */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">타이틀 굵기</label>
        <div className="flex gap-1">
          {TITLE_WEIGHT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTitleWeight(key)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] border-2 transition-all ${
                titleWeight === key
                  ? "border-gray-800 bg-white shadow-sm text-gray-800"
                  : "border-transparent bg-white/60 text-gray-500 hover:border-gray-200"
              }`}
              style={{ fontWeight: TITLE_WEIGHT_MAP[key].value }}
            >
              {TITLE_WEIGHT_MAP[key].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
