"use client";

import { create } from "zustand";
import { useCallback } from "react";
import { CompiledHandout, HandoutSection } from "@gyoanmaker/shared/types/handout";

export const DEFAULT_CUSTOM_HEADER_TEXT = "Grade 10 Sep 2025 Mock Exam";
export const DEFAULT_ANALYSIS_TITLE_TEXT = "Sentence Analysis & Translation";
export const DEFAULT_SUMMARY_TITLE_TEXT = "Key Summary";

interface HandoutStoreState {
  sections: Record<string, HandoutSection>;
  activeId: string;
  isApplying: boolean;
  progress: number;
  total: number;
  customHeaderText: string;
  analysisTitleText: string;
  summaryTitleText: string;
}

interface HandoutStoreActions {
  setCompiledData: (sections: CompiledHandout["sections"]) => void;
  setActiveId: (id: string) => void;
  updateSection: (id: string, section: HandoutSection) => void;
  setApplying: (isApplying: boolean) => void;
  setProgress: (progress: number) => void;
  setCustomHeaderText: (text: string) => void;
  setAnalysisTitleText: (text: string) => void;
  setSummaryTitleText: (text: string) => void;
}

type HandoutStore = HandoutStoreState & HandoutStoreActions;

export const useHandoutStore = create<HandoutStore>((set) => ({
  sections: {},
  activeId: "P01",
  isApplying: false,
  progress: 0,
  total: 20,
  customHeaderText: DEFAULT_CUSTOM_HEADER_TEXT,
  analysisTitleText: DEFAULT_ANALYSIS_TITLE_TEXT,
  summaryTitleText: DEFAULT_SUMMARY_TITLE_TEXT,

  setCompiledData: (sections) => {
    set({ sections, activeId: "P01", progress: 0, isApplying: false });
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

  setSummaryTitleText: (summaryTitleText) => {
    set({ summaryTitleText });
  },
}));

export function useSection(id: string): HandoutSection | undefined {
  return useHandoutStore(useCallback((state) => state.sections[id], [id]));
}
