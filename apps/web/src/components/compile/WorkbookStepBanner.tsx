"use client";

import {
  THEME_PRESETS,
  FONT_FAMILY_MAP,
  TITLE_WEIGHT_MAP,
  DEFAULT_SECTION_STYLE,
} from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

interface WorkbookStepBannerProps {
  badge: string; // e.g. "Workbook" or "정답지"
  label: string; // e.g. "STEP 1 스스로 분석"
}

export default function WorkbookStepBanner({
  badge,
  label,
}: WorkbookStepBannerProps) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const page2HeaderStyle =
    useTemplateSettingsStore((s) => s.page2HeaderStyle) ??
    DEFAULT_SECTION_STYLE;

  const base = THEME_PRESETS[preset];
  const primary =
    useCustom && customColors?.primary ? customColors.primary : base.primary;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  const barBg = page2HeaderStyle.bgColor || primary;
  const barTextColor = page2HeaderStyle.titleColor || "#FFFFFF";
  const barFontCss = page2HeaderStyle.fontFamily
    ? FONT_FAMILY_MAP[page2HeaderStyle.fontFamily].css
    : "GmarketSans, sans-serif";

  return (
    <div
      className="relative z-10 mb-3 h-10 rounded-r-xl flex items-center justify-between pr-6 w-[95%] mt-1 shrink-0"
      style={{
        backgroundColor: barBg,
        paddingTop: page2HeaderStyle.paddingTop ?? 0,
        paddingBottom: page2HeaderStyle.paddingBottom ?? 0,
        borderTop:
          page2HeaderStyle.borderStyle &&
          page2HeaderStyle.borderStyle !== "none"
            ? `1px ${page2HeaderStyle.borderStyle} ${page2HeaderStyle.borderColor || primary}`
            : undefined,
      }}
    >
      {/* Left: badge text */}
      <span
        className="tracking-wide ml-6"
        style={{
          fontFamily: barFontCss,
          fontWeight: titleFontWeight,
          fontSize: `${fontSizes.summaryBarTitle}px`,
          color: barTextColor,
        }}
      >
        {badge}
      </span>

      {/* Right: step label */}
      {label && (
        <span
          className="tracking-widest text-white/90"
          style={{
            fontFamily: barFontCss,
            fontWeight: titleFontWeight,
            fontSize: `${Math.max(fontSizes.summaryBarTitle - 2, 10)}px`,
            color: barTextColor,
            opacity: 0.85,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
