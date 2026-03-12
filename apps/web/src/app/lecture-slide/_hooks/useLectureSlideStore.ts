"use client";

import { create } from "zustand";
import type { HandoutSection } from "@gyoanmaker/shared/types";

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface SlideTheme {
  bg: string;
  titleColor: string;
  badgeBg: string;
  badgeText: string;
  bodyText: string;
}

export const PRESET_THEMES: Record<string, SlideTheme> = {
  dark: {
    bg: "000000",
    titleColor: "FFFF00",
    badgeBg: "FFFF00",
    badgeText: "000000",
    bodyText: "FFFFFF",
  },
  light: {
    bg: "FFFFFF",
    titleColor: "1E3A5F",
    badgeBg: "1E3A5F",
    badgeText: "FFFFFF",
    bodyText: "1E1E1E",
  },
  blue: {
    bg: "0F2044",
    titleColor: "60A5FA",
    badgeBg: "60A5FA",
    badgeText: "0F2044",
    bodyText: "FFFFFF",
  },
};

// ─── Font ────────────────────────────────────────────────────────────────────

export const FONT_OPTIONS = [
  { label: "Pretendard", value: "Pretendard" },
  { label: "Noto Sans KR", value: "Noto Sans KR" },
  { label: "GmarketSans", value: "GmarketSans" },
  { label: "KoPub Dotum", value: "KoPub Dotum" },
  { label: "돋움 (Dotum)", value: "Dotum" },
  { label: "Times New Roman", value: "Times New Roman" },
] as const;

export type FontValue = (typeof FONT_OPTIONS)[number]["value"];

// ─── Font key for per-section font control ───────────────────────────────────

export type SlideFontKey =
  | "badgeFont"
  | "topicEnFont"
  | "topicKoFont"
  | "sentenceEnFont"
  | "sentenceKoFont"
  | "vocabFont";

export type SlideFonts = Record<SlideFontKey, FontValue>;

const DEFAULT_FONTS: SlideFonts = {
  badgeFont: "Pretendard",
  topicEnFont: "Pretendard",
  topicKoFont: "Pretendard",
  sentenceEnFont: "Pretendard",
  sentenceKoFont: "Pretendard",
  vocabFont: "Pretendard",
};

export const FONT_KEY_LABELS: Record<SlideFontKey, string> = {
  badgeFont: "배지 (주제/요약)",
  topicEnFont: "주제·요약 영어",
  topicKoFont: "주제·요약 한국어",
  sentenceEnFont: "문장 영어",
  sentenceKoFont: "문장 한국어",
  vocabFont: "핵심어휘 표",
};

// ─── Slide Config ─────────────────────────────────────────────────────────────

export interface SlideConfig {
  preset: string;
  theme: SlideTheme;
  fonts: SlideFonts;
  logoDataUrl: string | null;
  logoWidth: number;         // 20~150px
  includeTopicSummary: boolean;
  includeSentences: boolean;
  includeVocab: boolean;
  // ── 1단계 편집 옵션 ──────────────────────────────────────────────────────
  showKorean: boolean;       // 한국어 표시 여부
  titleFontSize: number;     // 제목 폰트 크기 (14~28pt)
  bodyFontSize: number;      // 본문 폰트 크기 (10~22pt)
  passTitles: Record<number, string>; // passageIndex → 커스텀 제목
}

const DEFAULT_CONFIG: SlideConfig = {
  preset: "dark",
  theme: { ...PRESET_THEMES.dark },
  fonts: { ...DEFAULT_FONTS },
  logoDataUrl: null,
  logoWidth: 80,
  includeTopicSummary: true,
  includeSentences: true,
  includeVocab: true,
  showKorean: true,
  titleFontSize: 20,
  bodyFontSize: 14,
  passTitles: {},
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface LectureSlideState {
  step: 1 | 2 | 3;
  selectedHandoutId: string | null;
  selectedHandoutTitle: string;
  sections: HandoutSection[];
  config: SlideConfig;

  setStep: (step: 1 | 2 | 3) => void;
  selectHandout: (id: string, title: string) => void;
  setSections: (sections: HandoutSection[]) => void;
  applyPreset: (preset: string) => void;
  updateTheme: (partial: Partial<SlideTheme>) => void;
  setFontFor: (key: SlideFontKey, value: FontValue) => void;
  setAllFonts: (font: FontValue) => void;
  setLogo: (dataUrl: string | null) => void;
  setLogoWidth: (width: number) => void;
  toggleInclude: (key: "includeTopicSummary" | "includeSentences" | "includeVocab") => void;
  toggleShowKorean: () => void;
  setTitleFontSize: (size: number) => void;
  setBodyFontSize: (size: number) => void;
  setPassTitle: (passageIndex: number, title: string) => void;
  reset: () => void;
}

export const useLectureSlideStore = create<LectureSlideState>((set) => ({
  step: 1,
  selectedHandoutId: null,
  selectedHandoutTitle: "",
  sections: [],
  config: { ...DEFAULT_CONFIG, theme: { ...DEFAULT_CONFIG.theme }, fonts: { ...DEFAULT_FONTS }, passTitles: {} },

  setStep: (step) => set({ step }),

  selectHandout: (id, title) =>
    set({ selectedHandoutId: id, selectedHandoutTitle: title }),

  setSections: (sections) => set({ sections }),

  applyPreset: (preset) =>
    set((state) => ({
      config: {
        ...state.config,
        preset,
        theme:
          preset in PRESET_THEMES
            ? { ...PRESET_THEMES[preset as keyof typeof PRESET_THEMES] }
            : state.config.theme,
      },
    })),

  updateTheme: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        preset: "custom",
        theme: { ...state.config.theme, ...partial },
      },
    })),

  setFontFor: (key, value) =>
    set((state) => ({
      config: { ...state.config, fonts: { ...state.config.fonts, [key]: value } },
    })),

  setAllFonts: (font) =>
    set((state) => ({
      config: {
        ...state.config,
        fonts: Object.fromEntries(
          Object.keys(state.config.fonts).map((k) => [k, font])
        ) as SlideFonts,
      },
    })),

  setLogo: (dataUrl) =>
    set((state) => ({ config: { ...state.config, logoDataUrl: dataUrl } })),

  setLogoWidth: (width) =>
    set((state) => ({ config: { ...state.config, logoWidth: width } })),

  toggleInclude: (key) =>
    set((state) => ({
      config: { ...state.config, [key]: !state.config[key] },
    })),

  toggleShowKorean: () =>
    set((state) => ({
      config: { ...state.config, showKorean: !state.config.showKorean },
    })),

  setTitleFontSize: (size) =>
    set((state) => ({ config: { ...state.config, titleFontSize: size } })),

  setBodyFontSize: (size) =>
    set((state) => ({ config: { ...state.config, bodyFontSize: size } })),

  setPassTitle: (passageIndex, title) =>
    set((state) => ({
      config: {
        ...state.config,
        passTitles: { ...state.config.passTitles, [passageIndex]: title },
      },
    })),

  reset: () =>
    set({
      step: 1,
      selectedHandoutId: null,
      selectedHandoutTitle: "",
      sections: [],
      config: { ...DEFAULT_CONFIG, theme: { ...DEFAULT_CONFIG.theme }, fonts: { ...DEFAULT_FONTS }, passTitles: {} },
    }),
}));
