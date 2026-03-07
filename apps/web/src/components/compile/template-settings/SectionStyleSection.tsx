"use client";

import { useState } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { PAGE2_SECTION_LABELS, DEFAULT_SECTION_STYLE, THEME_PRESETS } from "@gyoanmaker/shared/types";
import type { Page2SectionKey, SectionStyleConfig } from "@gyoanmaker/shared/types";
import { ALL_SECTIONS } from "./constants";

const BORDER_STYLES: { value: SectionStyleConfig["borderStyle"]; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "solid", label: "실선" },
  { value: "dashed", label: "점선" },
];

const COLOR_SLOTS: { key: "titleColor" | "bgColor" | "textColor"; label: string; placeholder: string }[] = [
  { key: "titleColor", label: "타이틀 색상", placeholder: "테마 기본값" },
  { key: "bgColor",    label: "배경색",      placeholder: "투명" },
  { key: "textColor",  label: "텍스트 색상", placeholder: "기본값" },
];

function ColorSlot({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (hex: string) => void;
}) {
  const displayColor = value || fallback;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-500">{label}</span>
      <div className="flex items-center gap-1.5">
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[9px] text-gray-300 hover:text-gray-500"
            title="기본값으로 초기화"
          >
            ↺
          </button>
        )}
        <div className="relative w-6 h-6 rounded border border-gray-200 overflow-hidden">
          <input
            type="color"
            value={displayColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer opacity-0"
          />
          <div
            className="w-full h-full pointer-events-none"
            style={{ backgroundColor: displayColor, opacity: value ? 1 : 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionStyleItem({ sectionKey }: { sectionKey: Page2SectionKey }) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);
  const setSectionStyle = useTemplateSettingsStore((s) => s.setSectionStyle);

  const base = THEME_PRESETS[preset];
  const theme = useCustom && customColors ? { ...base, ...customColors } : base;
  const style = sectionStyles?.[sectionKey] ?? DEFAULT_SECTION_STYLE;

  const fallbacks = {
    titleColor: theme.primary,
    bgColor: "#ffffff",
    textColor: "#111827",
  };

  return (
    <div className="space-y-2.5">
      {/* Color slots */}
      <div className="space-y-1.5 p-2 rounded-lg bg-gray-50">
        {COLOR_SLOTS.map(({ key, label }) => (
          <ColorSlot
            key={key}
            label={label}
            value={style[key]}
            fallback={fallbacks[key]}
            onChange={(hex) => setSectionStyle(sectionKey, { [key]: hex })}
          />
        ))}
      </div>

      {/* Spacing & border */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <span className="text-[10px] text-gray-500">상단 여백</span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={40} value={style.paddingTop}
              onChange={(e) => setSectionStyle(sectionKey, { paddingTop: Number(e.target.value) })}
              className="w-full text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#5E35B1]"
            />
            <span className="text-[10px] text-gray-400">px</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] text-gray-500">하단 여백</span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={40} value={style.paddingBottom}
              onChange={(e) => setSectionStyle(sectionKey, { paddingBottom: Number(e.target.value) })}
              className="w-full text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#5E35B1]"
            />
            <span className="text-[10px] text-gray-400">px</span>
          </div>
        </div>
      </div>
      <div className="space-y-0.5">
        <span className="text-[10px] text-gray-500">상단 구분선</span>
        <div className="flex gap-1">
          {BORDER_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSectionStyle(sectionKey, { borderStyle: value })}
              className={`flex-1 py-1 rounded text-[10px] font-medium border transition-all ${
                style.borderStyle === value
                  ? "border-[#5E35B1] bg-[#5E35B1] text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  targetKey?: Page2SectionKey;
}

export default function SectionStyleSection({ targetKey }: Props) {
  const [isOpen, setIsOpen] = useState(!!targetKey);
  const keys = targetKey ? [targetKey] : ALL_SECTIONS;

  if (targetKey) {
    return (
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
          {PAGE2_SECTION_LABELS[targetKey]} 스타일
        </p>
        <SectionStyleItem sectionKey={targetKey} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">섹션별 스타일</p>
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="space-y-4">
          {keys.map((key) => (
            <div key={key} className="space-y-1 p-2 rounded-lg bg-white border border-gray-100">
              <span className="text-xs font-semibold text-gray-700">{PAGE2_SECTION_LABELS[key]}</span>
              <SectionStyleItem sectionKey={key} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
