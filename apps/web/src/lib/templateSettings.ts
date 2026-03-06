import { getDb } from "./firebase-admin";
import type { TemplateSettings, Page2SectionKey, ThemePreset, FontScale, FontFamily, TitleWeight, FontSizeConfig } from "@gyoanmaker/shared/types";
import {
  DEFAULT_TEMPLATE_SETTINGS,
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
