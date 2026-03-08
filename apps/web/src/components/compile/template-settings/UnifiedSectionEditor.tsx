"use client";

import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import {
  EDITABLE_SECTION_LABELS,
  DEFAULT_SECTION_STYLE,
  THEME_PRESETS,
  FONT_FAMILY_MAP,
  TITLE_WEIGHT_MAP,
  FONT_SIZE_SLOT_META,
  FONT_SIZE_PRESETS,
  getSectionFontSizeKeys,
  isBuiltInSectionKey,
} from "@gyoanmaker/shared/types";
import type {
  EditableSectionKey,
  BuiltInEditableKey,
  Page2SectionKey,
  SectionStyleConfig,
  FontFamily,
  FontSizeConfig,
} from "@gyoanmaker/shared/types";
import { TITLE_WEIGHT_KEYS } from "./constants";

const BORDER_STYLES: { value: SectionStyleConfig["borderStyle"]; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "solid", label: "실선" },
  { value: "dashed", label: "점선" },
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
  const isCustom = !!value;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-500">{label}</span>
        {isCustom && (
          <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1 py-px rounded">
            커스텀
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {isCustom && (
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
            style={{ backgroundColor: displayColor, opacity: isCustom ? 1 : 0.35 }}
          />
        </div>
      </div>
    </div>
  );
}

function FontSizeSlot({
  slotKey,
  label,
  note,
}: {
  slotKey: keyof FontSizeConfig;
  label: string;
  note?: string;
}) {
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontScale = useTemplateSettingsStore((s) => s.fontScale);
  const adjustFontSizeSlot = useTemplateSettingsStore((s) => s.adjustFontSizeSlot);
  const setFontSizeSlot = useTemplateSettingsStore((s) => s.setFontSizeSlot);

  const meta = FONT_SIZE_SLOT_META[slotKey];
  const value = fontSizes[slotKey];
  const presetValue = FONT_SIZE_PRESETS[fontScale][slotKey];
  const isModified = value !== presetValue;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500">{label}</span>
          {isModified && (
            <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1 py-px rounded">
              커스텀
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-mono w-12 text-right ${
              isModified ? "text-[#5E35B1] font-bold" : "text-gray-500"
            }`}
          >
            {value}
            {meta.unit}
          </span>
          <button
            type="button"
            onClick={() => adjustFontSizeSlot(slotKey, "down")}
            disabled={value <= meta.min}
            className="w-5 h-5 flex items-center justify-center rounded border border-gray-200 text-[10px] text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => adjustFontSizeSlot(slotKey, "up")}
            disabled={value >= meta.max}
            className="w-5 h-5 flex items-center justify-center rounded border border-gray-200 text-[10px] text-gray-500 hover:bg-gray-100 disabled:opacity-30"
          >
            +
          </button>
          {isModified && (
            <button
              type="button"
              onClick={() => setFontSizeSlot(slotKey, presetValue)}
              className="w-5 h-5 flex items-center justify-center rounded text-[10px] text-gray-400 hover:text-[#5E35B1]"
              title="프리셋 기본값"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      {note && <p className="text-[9px] text-gray-400 italic">{note}</p>}
    </div>
  );
}

function useEditorStyle(sectionKey: EditableSectionKey) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);
  const headerStyle = useTemplateSettingsStore((s) => s.headerStyle);
  const headerBadgeStyle = useTemplateSettingsStore((s) => s.headerBadgeStyle);
  const page1BodyStyle = useTemplateSettingsStore((s) => s.page1BodyStyle);
  const page2HeaderStyle = useTemplateSettingsStore((s) => s.page2HeaderStyle);
  const setSectionStyle = useTemplateSettingsStore((s) => s.setSectionStyle);
  const setHeaderStyle = useTemplateSettingsStore((s) => s.setHeaderStyle);
  const setHeaderBadgeStyle = useTemplateSettingsStore((s) => s.setHeaderBadgeStyle);
  const setPage1BodyStyle = useTemplateSettingsStore((s) => s.setPage1BodyStyle);
  const setPage2HeaderStyle = useTemplateSettingsStore((s) => s.setPage2HeaderStyle);
  const globalFontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const globalTitleWeight = useTemplateSettingsStore((s) => s.titleWeight);

  const base = THEME_PRESETS[preset];
  const theme = useCustom && customColors ? { ...base, ...customColors } : base;

  const style =
    sectionKey === "header"       ? (headerStyle ?? DEFAULT_SECTION_STYLE) :
    sectionKey === "headerBadge"  ? (headerBadgeStyle ?? DEFAULT_SECTION_STYLE) :
    sectionKey === "page1Body"   ? (page1BodyStyle ?? DEFAULT_SECTION_STYLE) :
    sectionKey === "page2Header" ? (page2HeaderStyle ?? DEFAULT_SECTION_STYLE) :
    (sectionStyles?.[sectionKey as Page2SectionKey] ?? DEFAULT_SECTION_STYLE);

  const handleChange = (partial: Partial<SectionStyleConfig>) => {
    if (sectionKey === "header") {
      setHeaderStyle(partial);
    } else if (sectionKey === "headerBadge") {
      setHeaderBadgeStyle(partial);
    } else if (sectionKey === "page1Body") {
      setPage1BodyStyle(partial);
    } else if (sectionKey === "page2Header") {
      setPage2HeaderStyle(partial);
    } else {
      setSectionStyle(sectionKey as Page2SectionKey, partial);
    }
  };

  return {
    theme,
    style,
    handleChange,
    globalFontFamily,
    globalTitleWeight,
    effectiveFontFamily: style.fontFamily || globalFontFamily,
    effectiveTitleWeight: style.titleWeight || globalTitleWeight,
  };
}

interface Props {
  sectionKey: EditableSectionKey;
}

export default function UnifiedSectionEditor({ sectionKey }: Props) {
  const { theme, style, handleChange, globalFontFamily, globalTitleWeight, effectiveFontFamily, effectiveTitleWeight } = useEditorStyle(sectionKey);

  const fallbacks = {
    titleColor: theme.primary,
    bgColor: "#ffffff",
    textColor: "#111827",
  };

  const fontSizeKeys = getSectionFontSizeKeys(sectionKey);

  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        {isBuiltInSectionKey(sectionKey) ? EDITABLE_SECTION_LABELS[sectionKey as BuiltInEditableKey] : "커스텀"} 섹션 편집
      </p>

      {/* Color Group */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-600">색상</p>
        <div className="space-y-1.5 p-2 rounded-lg bg-gray-50">
          <ColorSlot
            label="타이틀 색상"
            value={style.titleColor}
            fallback={fallbacks.titleColor}
            onChange={(hex) => handleChange({ titleColor: hex })}
          />
          <ColorSlot
            label="배경색"
            value={style.bgColor}
            fallback={fallbacks.bgColor}
            onChange={(hex) => handleChange({ bgColor: hex })}
          />
          {sectionKey !== "page2Header" && sectionKey !== "header" && sectionKey !== "headerBadge" && (
            <ColorSlot
              label="텍스트 색상"
              value={style.textColor}
              fallback={fallbacks.textColor}
              onChange={(hex) => handleChange({ textColor: hex })}
            />
          )}
        </div>
      </div>

      {/* Font Group */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-gray-600">폰트</p>

        {/* Font Family */}
        <div className="space-y-0.5">
          <label className="text-[10px] text-gray-500">폰트 패밀리</label>
          <select
            value={style.fontFamily}
            onChange={(e) =>
              handleChange({ fontFamily: e.target.value as FontFamily | "" })
            }
            className="w-full py-1.5 px-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:border-[#5E35B1] focus:outline-none appearance-none cursor-pointer"
            style={{ fontFamily: FONT_FAMILY_MAP[effectiveFontFamily].css }}
          >
            <option value="">
              전체 설정 사용 ({FONT_FAMILY_MAP[globalFontFamily].label})
            </option>
            {(Object.keys(FONT_FAMILY_MAP) as FontFamily[]).map((key) => (
              <option key={key} value={key} style={{ fontFamily: FONT_FAMILY_MAP[key].css }}>
                {FONT_FAMILY_MAP[key].label}
              </option>
            ))}
          </select>
          {style.fontFamily && (
            <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1 py-px rounded">
              커스텀
            </span>
          )}
        </div>

        {/* Title Weight */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-500">타이틀 굵기</label>
            {style.titleWeight && (
              <button
                type="button"
                onClick={() => handleChange({ titleWeight: "" })}
                className="text-[9px] text-gray-300 hover:text-gray-500 flex items-center gap-0.5"
                title="전체 설정 사용"
              >
                ↺ 전체
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {TITLE_WEIGHT_KEYS.map((key) => {
              const isSelected = effectiveTitleWeight === key;
              const isOverride = style.titleWeight === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    handleChange({
                      titleWeight: key === globalTitleWeight ? "" : key,
                    })
                  }
                  className={`flex-1 py-1 rounded-lg text-[10px] border transition-all ${
                    isSelected
                      ? isOverride
                        ? "border-[#5E35B1] bg-[#5E35B1]/10 text-[#5E35B1]"
                        : "border-gray-800 bg-white shadow-sm text-gray-800"
                      : "border-transparent bg-white/60 text-gray-500 hover:border-gray-200"
                  }`}
                  style={{ fontWeight: TITLE_WEIGHT_MAP[key].value }}
                >
                  {TITLE_WEIGHT_MAP[key].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Sizes */}
        <div className="space-y-1.5 p-2 rounded-lg bg-gray-50">
          <p className="text-[9px] text-gray-400 font-medium">폰트 크기</p>
          {fontSizeKeys.map((key) => (
            <FontSizeSlot
              key={key}
              slotKey={key}
              label={FONT_SIZE_SLOT_META[key].label}
              note={key === "sectionTitle" ? "공통: 모든 섹션 타이틀에 적용" : undefined}
            />
          ))}
        </div>
      </div>

      {/* Spacing Group */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-gray-600">여백</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500">상단</span>
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={0}
                max={40}
                value={style.paddingTop}
                onChange={(e) =>
                  handleChange({ paddingTop: Number(e.target.value) })
                }
                className="flex-1 h-1 accent-[#5E35B1]"
              />
              <span className="text-[10px] text-gray-500 w-8 text-right font-mono">
                {style.paddingTop}px
              </span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-gray-500">하단</span>
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={0}
                max={40}
                value={style.paddingBottom}
                onChange={(e) =>
                  handleChange({ paddingBottom: Number(e.target.value) })
                }
                className="flex-1 h-1 accent-[#5E35B1]"
              />
              <span className="text-[10px] text-gray-500 w-8 text-right font-mono">
                {style.paddingBottom}px
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Border Group */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-gray-600">상단 구분선</p>
        <div className="flex gap-1">
          {BORDER_STYLES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleChange({ borderStyle: value })}
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
        {style.borderStyle !== "none" && (
          <ColorSlot
            label="구분선 색상"
            value={style.borderColor}
            fallback={theme.primary}
            onChange={(hex) => handleChange({ borderColor: hex })}
          />
        )}
      </div>
    </div>
  );
}
