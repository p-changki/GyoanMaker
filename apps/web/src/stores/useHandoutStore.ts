"use client";

import { create } from "zustand";
import { useCallback } from "react";
import { CompiledHandout, HandoutSection } from "@gyoanmaker/shared/types/handout";
import type { HandoutIllustration, HandoutIllustrations } from "@gyoanmaker/shared/types";

export const DEFAULT_CUSTOM_HEADER_TEXT = "Grade 10 Sep 2025 Mock Exam";
export const DEFAULT_ANALYSIS_TITLE_TEXT = "Sentence Analysis & Translation";
export const DEFAULT_SUMMARY_TITLE_TEXT = "Key Summary";

interface HandoutStoreState {
  sections: Record<string, HandoutSection>;
  illustrations: HandoutIllustrations;
  activeId: string;
  isApplying: boolean;
  progress: number;
  total: number;
  customHeaderText: string;
  analysisTitleText: string;
  analysisTitleTexts: Record<string, string>;
  summaryTitleText: string;
  handoutModel: "flash" | "pro";
  pageNumberOverrides: Record<string, string>;
}

interface HandoutStoreActions {
  setCompiledData: (
    sections: CompiledHandout["sections"],
    illustrations?: HandoutIllustrations
  ) => void;
  setActiveId: (id: string) => void;
  updateSection: (id: string, section: HandoutSection) => void;
  updateSentenceEn: (sectionId: string, sentenceIndex: number, newText: string) => void;
  setIllustrations: (illustrations: HandoutIllustrations) => void;
  upsertIllustration: (id: string, illustration: HandoutIllustration) => void;
  setApplying: (isApplying: boolean) => void;
  setProgress: (progress: number) => void;
  setCustomHeaderText: (text: string) => void;
  setAnalysisTitleText: (text: string) => void;
  setPassageAnalysisTitleText: (passageId: string, text: string) => void;
  setSummaryTitleText: (text: string) => void;
  setHandoutModel: (model: "flash" | "pro") => void;
  setPageNumberOverride: (key: string, value: string) => void;
}

type HandoutStore = HandoutStoreState & HandoutStoreActions;

export const useHandoutStore = create<HandoutStore>((set) => ({
  sections: {},
  illustrations: {},
  activeId: "P01",
  isApplying: false,
  progress: 0,
  total: 20,
  customHeaderText: DEFAULT_CUSTOM_HEADER_TEXT,
  analysisTitleText: DEFAULT_ANALYSIS_TITLE_TEXT,
  analysisTitleTexts: {},
  summaryTitleText: DEFAULT_SUMMARY_TITLE_TEXT,
  handoutModel: "pro",
  pageNumberOverrides: {},

  setCompiledData: (sections, illustrations) => {
    set({
      sections,
      illustrations: illustrations ?? {},
      activeId: "P01",
      progress: 0,
      isApplying: false,
    });
  },

  setActiveId: (id) => {
    set({ activeId: id });
  },

  updateSection: (id, section) => {
    set((state) => {
      if (state.sections[id] === section) {
        return state;
      }

      return {
        sections: {
          ...state.sections,
          [id]: section,
        },
      };
    });
  },

  updateSentenceEn: (sectionId, sentenceIndex, newText) => {
    set((state) => {
      const section = state.sections[sectionId];
      if (!section) return state;
      return {
        sections: {
          ...state.sections,
          [sectionId]: {
            ...section,
            sentences: section.sentences.map((s, i) =>
              i === sentenceIndex ? { ...s, en: newText } : s
            ),
          },
        },
      };
    });
  },

  setIllustrations: (illustrations) => {
    set({ illustrations });
  },

  upsertIllustration: (id, illustration) => {
    set((state) => ({
      illustrations: {
        ...state.illustrations,
        [id]: illustration,
      },
    }));
  },

  setApplying: (isApplying) => {
    set({ isApplying });
  },

  setProgress: (progress) => {
    set({ progress });
  },

  setCustomHeaderText: (customHeaderText) => {
    set({ customHeaderText });
  },

  setAnalysisTitleText: (analysisTitleText) => {
    set({ analysisTitleText });
  },

  setPassageAnalysisTitleText: (passageId, text) =>
    set((state) => ({
      analysisTitleTexts: { ...state.analysisTitleTexts, [passageId]: text },
    })),

  setSummaryTitleText: (summaryTitleText) => {
    set({ summaryTitleText });
  },

  setHandoutModel: (handoutModel) => {
    set({ handoutModel });
  },

  setPageNumberOverride: (key, value) =>
    set((state) => ({
      pageNumberOverrides: { ...state.pageNumberOverrides, [key]: value },
    })),
}));

export function useSection(id: string): HandoutSection | undefined {
  return useHandoutStore(useCallback((state) => state.sections[id], [id]));
}

export function useIllustration(id: string): HandoutIllustration | undefined {
  return useHandoutStore(useCallback((state) => state.illustrations[id], [id]));
}
