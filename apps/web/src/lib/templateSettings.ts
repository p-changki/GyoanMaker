import { getDb } from "./firebase-admin";
import type { TemplateSettings, Page2SectionKey, ThemePreset, FontScale, FontFamily, TitleWeight, FontSizeConfig, Page1LayoutConfig, SectionStyleConfig, CustomThemeColors, VocabColumnLayout } from "@gyoanmaker/shared/types";
import {
  DEFAULT_TEMPLATE_SETTINGS,
  DEFAULT_PAGE1_LAYOUT,
  DEFAULT_SECTION_STYLE,
  VALID_PAGE2_SECTIONS,
  VALID_THEME_PRESETS,
  VALID_FONT_SCALES,
  VALID_FONT_FAMILIES,
  VALID_TITLE_WEIGHTS,
  FONT_SIZE_PRESETS,
  FONT_SIZE_SLOT_META,
} from "@gyoanmaker/shared/types";

const COLLECTION = "users";

interface UserDocLike {
  templateSettings?: Partial<TemplateSettings>;
}

function migrateOldFontSizes(obj: Record<string, unknown>): Record<string, unknown> {
  const migrated = { ...obj };
  const bodyEn = obj.bodyEn;
  const bodyKo = obj.bodyKo;
  const tableCell = obj.tableCell;

  if (typeof bodyEn === "number") {
    migrated.analysisEn ??= bodyEn;
    migrated.topicEn ??= bodyEn;
    migrated.summaryEn ??= bodyEn;
  }
  if (typeof bodyKo === "number") {
    migrated.analysisKo ??= bodyKo;
    migrated.topicKo ??= bodyKo;
    migrated.summaryKo ??= bodyKo;
  }
  if (typeof tableCell === "number") {
    migrated.flowText ??= tableCell;
    migrated.vocabText ??= tableCell;
  }
  return migrated;
}

function normalizeFontSizes(
  raw: unknown,
  fontScale: FontScale,
): FontSizeConfig {
  const preset = FONT_SIZE_PRESETS[fontScale];
  if (!raw || typeof raw !== "object") return preset;

  const obj = migrateOldFontSizes(raw as Record<string, unknown>);
  const SLOTS = Object.keys(FONT_SIZE_SLOT_META) as (keyof FontSizeConfig)[];
  const result = { ...preset };

  for (const key of SLOTS) {
    const val = obj[key];
    if (typeof val === "number" && Number.isFinite(val)) {
      const meta = FONT_SIZE_SLOT_META[key];
      result[key] = Math.min(meta.max, Math.max(meta.min, val));
    }
  }

  return result;
}

function isHexColor(val: unknown): val is string {
  return typeof val === "string" && /^#[0-9A-Fa-f]{6}$/.test(val);
}

function normalizePage1Layout(raw: unknown): Page1LayoutConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;

  const headerVisible = typeof obj.headerVisible === "boolean" ? obj.headerVisible : DEFAULT_PAGE1_LAYOUT.headerVisible;
  const sentenceColumnRatio =
    typeof obj.sentenceColumnRatio === "number" && obj.sentenceColumnRatio >= 0.5 && obj.sentenceColumnRatio <= 0.8
      ? obj.sentenceColumnRatio
      : DEFAULT_PAGE1_LAYOUT.sentenceColumnRatio;
  const numberStyle =
    obj.numberStyle === "padded" || obj.numberStyle === "plain" || obj.numberStyle === "circle"
      ? obj.numberStyle
      : DEFAULT_PAGE1_LAYOUT.numberStyle;
  const tableOuterBorderWidth =
    typeof obj.tableOuterBorderWidth === "number" && obj.tableOuterBorderWidth >= 1 && obj.tableOuterBorderWidth <= 10
      ? obj.tableOuterBorderWidth
      : DEFAULT_PAGE1_LAYOUT.tableOuterBorderWidth;

  return { headerVisible, sentenceColumnRatio, numberStyle, tableOuterBorderWidth };
}

function normalizeSectionStyle(raw: unknown): SectionStyleConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_SECTION_STYLE;
  const obj = raw as Record<string, unknown>;

  const paddingTop = typeof obj.paddingTop === "number" && obj.paddingTop >= 0 ? obj.paddingTop : DEFAULT_SECTION_STYLE.paddingTop;
  const paddingBottom = typeof obj.paddingBottom === "number" && obj.paddingBottom >= 0 ? obj.paddingBottom : DEFAULT_SECTION_STYLE.paddingBottom;
  const borderStyle =
    obj.borderStyle === "none" || obj.borderStyle === "solid" || obj.borderStyle === "dashed"
      ? obj.borderStyle
      : DEFAULT_SECTION_STYLE.borderStyle;
  const borderColor = typeof obj.borderColor === "string" ? obj.borderColor : DEFAULT_SECTION_STYLE.borderColor;
  const titleColor = typeof obj.titleColor === "string" ? obj.titleColor : DEFAULT_SECTION_STYLE.titleColor;
  const bgColor = typeof obj.bgColor === "string" ? obj.bgColor : DEFAULT_SECTION_STYLE.bgColor;
  const textColor = typeof obj.textColor === "string" ? obj.textColor : DEFAULT_SECTION_STYLE.textColor;
  const fontFamily =
    typeof obj.fontFamily === "string" && (obj.fontFamily === "" || VALID_FONT_FAMILIES.has(obj.fontFamily as FontFamily))
      ? (obj.fontFamily as FontFamily | "")
      : DEFAULT_SECTION_STYLE.fontFamily;
  const titleWeight =
    typeof obj.titleWeight === "string" && (obj.titleWeight === "" || VALID_TITLE_WEIGHTS.has(obj.titleWeight as TitleWeight))
      ? (obj.titleWeight as TitleWeight | "")
      : DEFAULT_SECTION_STYLE.titleWeight;

  return { paddingTop, paddingBottom, borderStyle, borderColor, titleColor, bgColor, textColor, fontFamily, titleWeight };
}

function normalizeSectionStyles(raw: unknown): Partial<Record<Page2SectionKey, SectionStyleConfig>> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const result: Partial<Record<Page2SectionKey, SectionStyleConfig>> = {};
  const validKeys: Page2SectionKey[] = ["topic", "summary", "flow", "vocabulary"];
  for (const key of validKeys) {
    if (obj[key]) {
      result[key] = normalizeSectionStyle(obj[key]);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeCustomThemeColors(raw: unknown): CustomThemeColors | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!isHexColor(obj.primary) || !isHexColor(obj.primaryDark) || !isHexColor(obj.headerBg) || !isHexColor(obj.sentenceBg)) {
    return null;
  }
  return {
    primary: obj.primary,
    primaryDark: obj.primaryDark,
    headerBg: obj.headerBg,
    sentenceBg: obj.sentenceBg,
  };
}

function normalizeVocabColumnLayout(raw: unknown): VocabColumnLayout | undefined {
  if (raw === 2 || raw === 3 || raw === 4) return raw;
  return undefined;
}

function normalizeSettings(raw: Partial<TemplateSettings> | undefined): TemplateSettings {
  const academyName =
    typeof raw?.academyName === "string" ? raw.academyName.slice(0, 20) : null;

  const logoBase64 =
    typeof raw?.logoBase64 === "string" && raw.logoBase64.startsWith("data:image/")
      ? raw.logoBase64
      : null;

  const avatarBase64 =
    typeof raw?.avatarBase64 === "string" && raw.avatarBase64.startsWith("data:image/")
      ? raw.avatarBase64
      : null;

  const themePreset =
    typeof raw?.themePreset === "string" && VALID_THEME_PRESETS.has(raw.themePreset as ThemePreset)
      ? (raw.themePreset as ThemePreset)
      : DEFAULT_TEMPLATE_SETTINGS.themePreset;

  const page2Sections = Array.isArray(raw?.page2Sections)
    ? (raw.page2Sections.filter((k): k is Page2SectionKey =>
        VALID_PAGE2_SECTIONS.has(k as Page2SectionKey)
      ))
    : DEFAULT_TEMPLATE_SETTINGS.page2Sections;

  const fontScale =
    typeof raw?.fontScale === "string" && VALID_FONT_SCALES.has(raw.fontScale as FontScale)
      ? (raw.fontScale as FontScale)
      : DEFAULT_TEMPLATE_SETTINGS.fontScale;

  const fontFamily =
    typeof raw?.fontFamily === "string" && VALID_FONT_FAMILIES.has(raw.fontFamily as FontFamily)
      ? (raw.fontFamily as FontFamily)
      : DEFAULT_TEMPLATE_SETTINGS.fontFamily;

  const titleWeight =
    typeof raw?.titleWeight === "string" && VALID_TITLE_WEIGHTS.has(raw.titleWeight as TitleWeight)
      ? (raw.titleWeight as TitleWeight)
      : DEFAULT_TEMPLATE_SETTINGS.titleWeight;

  const defaultHeaderText =
    typeof raw?.defaultHeaderText === "string" && raw.defaultHeaderText.trim()
      ? raw.defaultHeaderText.slice(0, 50)
      : null;

  const defaultAnalysisTitle =
    typeof raw?.defaultAnalysisTitle === "string" && raw.defaultAnalysisTitle.trim()
      ? raw.defaultAnalysisTitle.slice(0, 50)
      : null;

  const defaultSummaryTitle =
    typeof raw?.defaultSummaryTitle === "string" && raw.defaultSummaryTitle.trim()
      ? raw.defaultSummaryTitle.slice(0, 50)
      : null;

  const fontSizes = normalizeFontSizes(raw?.fontSizes, fontScale);

  // Phase 1
  const page1Layout = normalizePage1Layout(raw?.page1Layout);
  const headerStyle = raw?.headerStyle ? normalizeSectionStyle(raw.headerStyle) : undefined;
  const headerBadgeStyle = raw?.headerBadgeStyle ? normalizeSectionStyle(raw.headerBadgeStyle) : undefined;
  const page1BodyStyle = raw?.page1BodyStyle ? normalizeSectionStyle(raw.page1BodyStyle) : undefined;
  const page2HeaderStyle = raw?.page2HeaderStyle ? normalizeSectionStyle(raw.page2HeaderStyle) : undefined;
  const sectionStyles = normalizeSectionStyles(raw?.sectionStyles);
  const vocabColumnLayout = normalizeVocabColumnLayout(raw?.vocabColumnLayout);
  const customThemeColors = normalizeCustomThemeColors(raw?.customThemeColors);
  const useCustomTheme = typeof raw?.useCustomTheme === "boolean" ? raw.useCustomTheme : undefined;

  return {
    academyName,
    logoBase64,
    avatarBase64,
    page2Sections: page2Sections.length > 0
      ? page2Sections
      : DEFAULT_TEMPLATE_SETTINGS.page2Sections,
    themePreset,
    defaultHeaderText,
    defaultAnalysisTitle,
    defaultSummaryTitle,
    fontScale,
    fontFamily,
    titleWeight,
    fontSizes,
    ...(page1Layout !== undefined && { page1Layout }),
    ...(headerStyle !== undefined && { headerStyle }),
    ...(headerBadgeStyle !== undefined && { headerBadgeStyle }),
    ...(page1BodyStyle !== undefined && { page1BodyStyle }),
    ...(page2HeaderStyle !== undefined && { page2HeaderStyle }),
    ...(sectionStyles !== undefined && { sectionStyles }),
    ...(vocabColumnLayout !== undefined && { vocabColumnLayout }),
    ...(customThemeColors !== null && customThemeColors !== undefined && { customThemeColors }),
    ...(useCustomTheme !== undefined && { useCustomTheme }),
  };
}

export async function getTemplateSettings(
  email: string
): Promise<TemplateSettings> {
  const key = email.toLowerCase();
  const snap = await getDb().collection(COLLECTION).doc(key).get();
  const data = (snap.data() ?? {}) as UserDocLike;
  return normalizeSettings(data.templateSettings);
}

export async function updateTemplateSettings(
  email: string,
  settings: Partial<TemplateSettings>
): Promise<TemplateSettings> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  const snap = await docRef.get();
  const existing = (snap.data() ?? {}) as UserDocLike;
  const merged = normalizeSettings({
    ...existing.templateSettings,
    ...settings,
  });

  await docRef.set({ templateSettings: merged }, { merge: true });
  return merged;
}
