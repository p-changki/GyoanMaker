"use client";

import { useState, useRef, useEffect } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import {
  FONT_FAMILY_MAP,
  TITLE_WEIGHT_MAP,
  FONT_SIZE_PRESETS,
  FONT_SIZE_GROUPS,
} from "@gyoanmaker/shared/types";
import type { FontFamily } from "@gyoanmaker/shared/types";
import { FONT_SCALE_OPTIONS, TITLE_WEIGHT_KEYS } from "./constants";

const FONT_KEYS = Object.keys(FONT_FAMILY_MAP) as FontFamily[];

function FontFamilyDropdown({
  value,
  onChange,
}: {
  value: FontFamily;
  onChange: (family: FontFamily) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg border-2 bg-white text-xs text-gray-700 transition-colors cursor-pointer ${
          open ? "border-[#5E35B1] ring-1 ring-[#5E35B1]/20" : "border-gray-200 hover:border-gray-300"
        }`}
        style={{ fontFamily: FONT_FAMILY_MAP[value].css }}
      >
        <span className="font-medium">{FONT_FAMILY_MAP[value].label}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg py-1 max-h-[240px] overflow-y-auto">
          {FONT_KEYS.map((key) => {
            const isSelected = value === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { onChange(key); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-[#5E35B1]/5 text-[#5E35B1] font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                style={{ fontFamily: FONT_FAMILY_MAP[key].css }}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-[#5E35B1] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!isSelected && <span className="w-3.5 shrink-0" />}
                <span>{FONT_FAMILY_MAP[key].label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FontSettingsSectionProps {
  onOpenDetail: () => void;
}

export default function FontSettingsSection({ onOpenDetail }: FontSettingsSectionProps) {
  const fontScale = useTemplateSettingsStore((s) => s.fontScale);
  const setFontScale = useTemplateSettingsStore((s) => s.setFontScale);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const setFontFamily = useTemplateSettingsStore((s) => s.setFontFamily);
  const fontFamilyKo = useTemplateSettingsStore((s) => s.fontFamilyKo);
  const setFontFamilyKo = useTemplateSettingsStore((s) => s.setFontFamilyKo);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const setTitleWeight = useTemplateSettingsStore((s) => s.setTitleWeight);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const effectiveKoFont = fontFamilyKo || fontFamily;

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

      {/* Font Family - EN */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">영어 폰트</label>
        <FontFamilyDropdown value={fontFamily} onChange={setFontFamily} />
      </div>

      {/* Font Family - KO */}
      <div>
        <label className="text-[10px] text-gray-500 mb-1 block">한글 폰트</label>
        <FontFamilyDropdown value={effectiveKoFont} onChange={(f) => setFontFamilyKo(f)} />
        {fontFamilyKo && (
          <button
            type="button"
            onClick={() => setFontFamilyKo(undefined)}
            className="text-[9px] text-gray-400 hover:text-[#5E35B1] mt-1 transition-colors"
          >
            영어 폰트와 동일하게
          </button>
        )}
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
