import { THEME_PRESETS, DEFAULT_SECTION_STYLE } from "@gyoanmaker/shared/types";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

export function useSectionStyle(sectionKey: Page2SectionKey) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);
  const globalFontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const globalTitleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);

  const base = THEME_PRESETS[preset];
  const theme = useCustom && customColors ? { ...base, ...customColors } : base;
  const style = sectionStyles?.[sectionKey] ?? DEFAULT_SECTION_STYLE;

  const fontFamily = style.fontFamily || globalFontFamily;
  const titleWeight = style.titleWeight || globalTitleWeight;

  const textAlign = (style.textAlign || "justify") as "left" | "center" | "right" | "justify";

  return {
    titleColor: style.titleColor || theme.primary,
    bgColor: style.bgColor || "",
    textColor: style.textColor || "#111827",
    sentenceBg: theme.sentenceBg,
    borderColor: style.borderColor || theme.primary,
    theme,
    fontFamily,
    titleWeight,
    fontSizes,
    textAlign,
  };
}
