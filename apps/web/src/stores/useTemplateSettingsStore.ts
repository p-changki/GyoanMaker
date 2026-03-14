"use client";

import { create } from "zustand";
import type { Page2SectionKey, TemplateSettings, ThemePreset, FontScale, FontFamily, TitleWeight, FontSizeConfig, Page1LayoutConfig, SectionStyleConfig, VocabColumnLayout, CustomThemeColors, CustomSectionContent, CustomSectionKey, VocabDisplayConfig, SummaryLanguage, ImageDisplayConfig } from "@gyoanmaker/shared/types";
import { DEFAULT_TEMPLATE_SETTINGS, DEFAULT_PAGE1_LAYOUT, DEFAULT_SECTION_STYLE, DEFAULT_IMAGE_DISPLAY, FONT_SIZE_PRESETS, FONT_SIZE_SLOT_META, MAX_CUSTOM_SECTIONS, isCustomSectionKey, isBuiltInSectionKey } from "@gyoanmaker/shared/types";

interface TemplateSettingsState extends TemplateSettings {
  hydrated: boolean;
  lastSavedSnapshot: TemplateSettings | null;
}

interface TemplateSettingsActions {
  setAcademyName: (name: string | null) => void;
  setLogoBase64: (logo: string | null) => void;
  setAvatarBase64: (avatar: string | null) => void;
  toggleSection: (key: Page2SectionKey) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setDefaultHeaderText: (text: string | null) => void;
  setDefaultAnalysisTitle: (text: string | null) => void;
  setDefaultSummaryTitle: (text: string | null) => void;
  setFontScale: (scale: FontScale) => void;
  setFontFamily: (family: FontFamily) => void;
  setFontFamilyKo: (family: FontFamily | undefined) => void;
  setTitleWeight: (weight: TitleWeight) => void;
  adjustFontSizeSlot: (key: keyof FontSizeConfig, direction: "up" | "down") => void;
  setFontSizeSlot: (key: keyof FontSizeConfig, value: number) => void;
  moveSection: (key: Page2SectionKey, direction: "up" | "down") => void;
  loadSettings: (settings: TemplateSettings) => void;
  resetToDefaults: () => void;
  // Phase 1
  setPage1Layout: (partial: Partial<Page1LayoutConfig>) => void;
  setSectionStyle: (key: Page2SectionKey, partial: Partial<SectionStyleConfig>) => void;
  setVocabColumnLayout: (layout: VocabColumnLayout) => void;
  setCustomThemeColors: (partial: Partial<CustomThemeColors>) => void;
  setUseCustomTheme: (value: boolean) => void;
  setHeaderStyle: (partial: Partial<SectionStyleConfig>) => void;
  setHeaderBadgeStyle: (partial: Partial<SectionStyleConfig>) => void;
  setPage1TitleStyle: (partial: Partial<SectionStyleConfig>) => void;
  setPage1BodyStyle: (partial: Partial<SectionStyleConfig>) => void;
  setPage2HeaderStyle: (partial: Partial<SectionStyleConfig>) => void;
  resetHeaderStyle: () => void;
  resetHeaderBadgeStyle: () => void;
  resetPage1TitleStyle: () => void;
  resetPage1BodyStyle: () => void;
  resetPage2HeaderStyle: () => void;
  resetSectionStyleToGlobal: (key: Page2SectionKey) => void;
  setLastSavedSnapshot: (snapshot: TemplateSettings) => void;
  // Custom sections
  addCustomSection: () => void;
  removeCustomSection: (key: CustomSectionKey) => void;
  setCustomSectionContent: (key: CustomSectionKey, partial: Partial<CustomSectionContent>) => void;
  // Phase 2 display options
  setVocabDisplay: (partial: Partial<VocabDisplayConfig>) => void;
  setSummaryLanguage: (lang: SummaryLanguage) => void;
  // Image display config
  setLogoDisplay: (partial: Partial<ImageDisplayConfig>) => void;
  setAvatarDisplay: (partial: Partial<ImageDisplayConfig>) => void;
  setSectionTitle: (key: Page2SectionKey, title: string) => void;
  setSubSectionTitle: (key: string, title: string) => void;
  setSubSectionColor: (key: string, color: string) => void;
  setSectionBadgeConfig: (key: "handout" | "workbook" | "vocabBank", partial: Partial<import("@gyoanmaker/shared/types").SectionBadgeConfig>) => void;
  setPage2HeaderVisible: (visible: boolean) => void;
  setPage1TitleVisible: (visible: boolean) => void;
}

type TemplateSettingsStore = TemplateSettingsState & TemplateSettingsActions;

export const useTemplateSettingsStore = create<TemplateSettingsStore>(
  (set) => ({
    ...DEFAULT_TEMPLATE_SETTINGS,
    hydrated: false,
    lastSavedSnapshot: null,

    setAcademyName: (academyName) => set({ academyName }),

    setLogoBase64: (logoBase64) => set({ logoBase64 }),

    setAvatarBase64: (avatarBase64) => set({ avatarBase64 }),

    setThemePreset: (themePreset) =>
      set((state) => {
        // Clear color overrides in section styles so the new theme colors apply.
        const clearColors = (s: import("@gyoanmaker/shared/types").SectionStyleConfig | undefined) =>
          s ? { ...s, bgColor: "", titleColor: "", textColor: "" } : undefined;
        return {
          themePreset,
          useCustomTheme: false,
          headerStyle: clearColors(state.headerStyle),
          headerBadgeStyle: clearColors(state.headerBadgeStyle),
          page1BodyStyle: clearColors(state.page1BodyStyle),
          page2HeaderStyle: clearColors(state.page2HeaderStyle),
          sectionStyles: state.sectionStyles
            ? Object.fromEntries(
                Object.entries(state.sectionStyles).map(([k, v]) => [k, clearColors(v)])
              ) as typeof state.sectionStyles
            : undefined,
        };
      }),

    setDefaultHeaderText: (defaultHeaderText) => set({ defaultHeaderText }),

    setDefaultAnalysisTitle: (defaultAnalysisTitle) => set({ defaultAnalysisTitle }),

    setDefaultSummaryTitle: (defaultSummaryTitle) => set({ defaultSummaryTitle }),

    setFontScale: (fontScale) => set({ fontScale, fontSizes: FONT_SIZE_PRESETS[fontScale] }),

    setFontFamily: (fontFamily) => set({ fontFamily }),

    setFontFamilyKo: (fontFamilyKo) => set({ fontFamilyKo }),

    setTitleWeight: (titleWeight) => set({ titleWeight }),

    adjustFontSizeSlot: (key, direction) =>
      set((state) => {
        const meta = FONT_SIZE_SLOT_META[key];
        const current = state.fontSizes[key];
        const next = direction === "up"
          ? Math.min(meta.max, +(current + meta.step).toFixed(1))
          : Math.max(meta.min, +(current - meta.step).toFixed(1));
        if (next === current) return state;
        return { fontSizes: { ...state.fontSizes, [key]: next } };
      }),

    setFontSizeSlot: (key, value) =>
      set((state) => ({
        fontSizes: { ...state.fontSizes, [key]: value },
      })),

    toggleSection: (key) =>
      set((state) => {
        const current = state.page2Sections;
        const included = current.includes(key);
        if (included && current.length <= 1) return state;
        const next = included
          ? current.filter((k) => k !== key)
          : [...current, key];
        return { page2Sections: next };
      }),

    moveSection: (key, direction) =>
      set((state) => {
        const arr = [...state.page2Sections];
        const idx = arr.indexOf(key);
        if (idx === -1) return state;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= arr.length) return state;
        [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
        return { page2Sections: arr };
      }),

    loadSettings: (settings) =>
      set(() => {
        // Clean orphan custom keys from page2Sections
        const validCustomKeys = new Set(Object.keys(settings.customSections ?? {}));
        const cleanedSections = settings.page2Sections.filter(
          (k) => isBuiltInSectionKey(k) || validCustomKeys.has(k)
        );
        return {
          ...settings,
          page2Sections: cleanedSections,
          fontSizes: settings.fontSizes ?? FONT_SIZE_PRESETS[settings.fontScale ?? "medium"],
          hydrated: true,
          lastSavedSnapshot: settings,
        };
      }),

    resetToDefaults: () =>
      set({
        ...DEFAULT_TEMPLATE_SETTINGS,
        // Explicitly clear optional style fields (set() merges, so undefined fields persist)
        headerStyle: undefined,
        headerBadgeStyle: undefined,
        page1TitleStyle: undefined,
        page1BodyStyle: undefined,
        page2HeaderStyle: undefined,
        sectionStyles: undefined,
        page1Layout: undefined,
        vocabColumnLayout: undefined,
        customThemeColors: undefined,
        useCustomTheme: undefined,
        customSections: undefined,
        vocabDisplay: undefined,
        summaryLanguage: undefined,
        logoDisplay: undefined,
        avatarDisplay: undefined,
        fontFamilyKo: undefined,
        sectionTitles: undefined,
        subSectionTitles: undefined,
        subSectionColors: undefined,
        page2HeaderVisible: undefined,
        page1TitleVisible: undefined,
      }),

    // Phase 1 actions
    setPage1Layout: (partial) =>
      set((state) => ({
        page1Layout: { ...(state.page1Layout ?? DEFAULT_PAGE1_LAYOUT), ...partial },
      })),

    setSectionStyle: (key, partial) =>
      set((state) => {
        const existing = state.sectionStyles?.[key] ?? DEFAULT_SECTION_STYLE;
        return {
          sectionStyles: {
            ...state.sectionStyles,
            [key]: { ...existing, ...partial },
          },
        };
      }),

    setVocabColumnLayout: (vocabColumnLayout) => set({ vocabColumnLayout }),

    setCustomThemeColors: (partial) =>
      set((state) => {
        const existing = state.customThemeColors ?? { primary: "#5E35B1", primaryDark: "#4527A0", headerBg: "#FFE4E1", sentenceBg: "#FFE8E8" };
        return { customThemeColors: { ...existing, ...partial } };
      }),

    setUseCustomTheme: (useCustomTheme) => set({ useCustomTheme }),

    setHeaderStyle: (partial) =>
      set((state) => ({
        headerStyle: { ...(state.headerStyle ?? DEFAULT_SECTION_STYLE), ...partial },
      })),

    setHeaderBadgeStyle: (partial) =>
      set((state) => ({
        headerBadgeStyle: { ...(state.headerBadgeStyle ?? DEFAULT_SECTION_STYLE), ...partial },
      })),

    setPage1TitleStyle: (partial) =>
      set((state) => ({
        page1TitleStyle: { ...(state.page1TitleStyle ?? DEFAULT_SECTION_STYLE), ...partial },
      })),

    setPage1BodyStyle: (partial) =>
      set((state) => ({
        page1BodyStyle: { ...(state.page1BodyStyle ?? DEFAULT_SECTION_STYLE), ...partial },
      })),

    setPage2HeaderStyle: (partial) =>
      set((state) => ({
        page2HeaderStyle: { ...(state.page2HeaderStyle ?? DEFAULT_SECTION_STYLE), ...partial },
      })),

    resetHeaderStyle: () => set({ headerStyle: undefined }),

    resetHeaderBadgeStyle: () => set({ headerBadgeStyle: undefined }),

    resetPage1TitleStyle: () => set({ page1TitleStyle: undefined }),

    resetPage1BodyStyle: () => set({ page1BodyStyle: undefined }),

    resetPage2HeaderStyle: () => set({ page2HeaderStyle: undefined }),

    resetSectionStyleToGlobal: (key) =>
      set((state) => {
        if (!state.sectionStyles) return state;
        const next = Object.fromEntries(
          Object.entries(state.sectionStyles).filter(([k]) => k !== key)
        );
        return { sectionStyles: Object.keys(next).length > 0 ? next : undefined };
      }),

    // Custom sections
    addCustomSection: () =>
      set((state) => {
        const existing = state.customSections ?? {};
        const count = Object.keys(existing).length;
        if (count >= MAX_CUSTOM_SECTIONS) return state;
        // Find next available ID
        let nextId = 1;
        while (existing[`custom_${nextId}`]) nextId++;
        const key = `custom_${nextId}` as CustomSectionKey;
        return {
          customSections: { ...existing, [key]: { title: "새 섹션", body: "" } },
          page2Sections: [...state.page2Sections, key],
        };
      }),

    removeCustomSection: (key) =>
      set((state) => {
        if (!isCustomSectionKey(key)) return state;
        const rest = Object.fromEntries(Object.entries(state.customSections ?? {}).filter(([k]) => k !== key));
        const nextSections = Object.keys(rest).length > 0 ? rest : undefined;
        const nextStyles = state.sectionStyles
          ? Object.fromEntries(Object.entries(state.sectionStyles).filter(([k]) => k !== key))
          : undefined;
        return {
          customSections: nextSections,
          page2Sections: state.page2Sections.filter((k) => k !== key),
          sectionStyles: nextStyles && Object.keys(nextStyles).length > 0
            ? nextStyles as typeof state.sectionStyles
            : undefined,
        };
      }),

    setCustomSectionContent: (key, partial) =>
      set((state) => {
        const existing = state.customSections?.[key];
        if (!existing) return state;
        return {
          customSections: {
            ...state.customSections,
            [key]: { ...existing, ...partial },
          },
        };
      }),

    // Phase 2 display options
    setVocabDisplay: (partial) =>
      set((state) => ({
        vocabDisplay: { ...(state.vocabDisplay ?? {}), ...partial },
      })),

    setSummaryLanguage: (summaryLanguage) => set({ summaryLanguage }),

    // Image display config
    setLogoDisplay: (partial) =>
      set((state) => ({
        logoDisplay: { ...(state.logoDisplay ?? DEFAULT_IMAGE_DISPLAY), ...partial },
      })),

    setAvatarDisplay: (partial) =>
      set((state) => ({
        avatarDisplay: { ...(state.avatarDisplay ?? DEFAULT_IMAGE_DISPLAY), ...partial },
      })),

    setLastSavedSnapshot: (snapshot) => set({ lastSavedSnapshot: snapshot }),

    setSectionTitle: (key, title) =>
      set((state) => ({
        sectionTitles: { ...state.sectionTitles, [key]: title },
      })),

    setSubSectionTitle: (key, title) =>
      set((state) => ({
        subSectionTitles: { ...state.subSectionTitles, [key]: title },
      })),

    setSubSectionColor: (key, color) =>
      set((state) => ({
        subSectionColors: { ...state.subSectionColors, [key]: color },
      })),

    setSectionBadgeConfig: (key, partial) =>
      set((state) => ({
        sectionBadgeConfig: {
          ...state.sectionBadgeConfig,
          [key]: { ...state.sectionBadgeConfig?.[key], ...partial },
        },
      })),

    setPage2HeaderVisible: (page2HeaderVisible) => set({ page2HeaderVisible }),

    setPage1TitleVisible: (page1TitleVisible) => set({ page1TitleVisible }),
  })
);

export function extractSettings(state: TemplateSettingsStore): TemplateSettings {
  return {
    academyName: state.academyName,
    logoBase64: state.logoBase64,
    avatarBase64: state.avatarBase64,
    page2Sections: state.page2Sections,
    themePreset: state.themePreset,
    defaultHeaderText: state.defaultHeaderText,
    defaultAnalysisTitle: state.defaultAnalysisTitle,
    defaultSummaryTitle: state.defaultSummaryTitle,
    fontScale: state.fontScale,
    fontFamily: state.fontFamily,
    fontFamilyKo: state.fontFamilyKo,
    titleWeight: state.titleWeight,
    fontSizes: state.fontSizes,
    page1Layout: state.page1Layout,
    headerStyle: state.headerStyle,
    headerBadgeStyle: state.headerBadgeStyle,
    page1TitleStyle: state.page1TitleStyle,
    page1BodyStyle: state.page1BodyStyle,
    page2HeaderStyle: state.page2HeaderStyle,
    sectionStyles: state.sectionStyles,
    vocabColumnLayout: state.vocabColumnLayout,
    customThemeColors: state.customThemeColors,
    useCustomTheme: state.useCustomTheme,
    customSections: state.customSections,
    vocabDisplay: state.vocabDisplay,
    summaryLanguage: state.summaryLanguage,
    logoDisplay: state.logoDisplay,
    avatarDisplay: state.avatarDisplay,
    sectionTitles: state.sectionTitles,
    subSectionTitles: state.subSectionTitles,
    subSectionColors: state.subSectionColors,
    sectionBadgeConfig: state.sectionBadgeConfig,
    page2HeaderVisible: state.page2HeaderVisible,
    page1TitleVisible: state.page1TitleVisible,
  };
}

function shallowEqualSettings(a: TemplateSettings, b: TemplateSettings): boolean {
  const keys = Object.keys(a) as (keyof TemplateSettings)[];
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function useIsDirty(): boolean {
  return useTemplateSettingsStore((s) => {
    if (!s.lastSavedSnapshot) return false;
    return !shallowEqualSettings(extractSettings(s), s.lastSavedSnapshot);
  });
}
