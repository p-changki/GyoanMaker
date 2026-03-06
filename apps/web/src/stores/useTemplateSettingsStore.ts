"use client";

import { create } from "zustand";
import type { Page2SectionKey, TemplateSettings, ThemePreset, FontScale, FontFamily, TitleWeight, FontSizeConfig } from "@gyoanmaker/shared/types";
import { DEFAULT_TEMPLATE_SETTINGS, FONT_SIZE_PRESETS, FONT_SIZE_SLOT_META } from "@gyoanmaker/shared/types";

interface TemplateSettingsState extends TemplateSettings {
  hydrated: boolean;
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
  setTitleWeight: (weight: TitleWeight) => void;
  adjustFontSizeSlot: (key: keyof FontSizeConfig, direction: "up" | "down") => void;
  setFontSizeSlot: (key: keyof FontSizeConfig, value: number) => void;
  moveSection: (key: Page2SectionKey, direction: "up" | "down") => void;
  loadSettings: (settings: TemplateSettings) => void;
  resetToDefaults: () => void;
}

type TemplateSettingsStore = TemplateSettingsState & TemplateSettingsActions;

export const useTemplateSettingsStore = create<TemplateSettingsStore>(
  (set) => ({
    ...DEFAULT_TEMPLATE_SETTINGS,
    hydrated: false,

    setAcademyName: (academyName) => set({ academyName }),

    setLogoBase64: (logoBase64) => set({ logoBase64 }),

    setAvatarBase64: (avatarBase64) => set({ avatarBase64 }),

    setThemePreset: (themePreset) => set({ themePreset }),

    setDefaultHeaderText: (defaultHeaderText) => set({ defaultHeaderText }),

    setDefaultAnalysisTitle: (defaultAnalysisTitle) => set({ defaultAnalysisTitle }),

    setDefaultSummaryTitle: (defaultSummaryTitle) => set({ defaultSummaryTitle }),

    setFontScale: (fontScale) => set({ fontScale, fontSizes: FONT_SIZE_PRESETS[fontScale] }),

    setFontFamily: (fontFamily) => set({ fontFamily }),

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
      set({
        ...settings,
        fontSizes: settings.fontSizes ?? FONT_SIZE_PRESETS[settings.fontScale ?? "medium"],
        hydrated: true,
      }),

    resetToDefaults: () =>
      set({
        ...DEFAULT_TEMPLATE_SETTINGS,
      }),
  })
);
