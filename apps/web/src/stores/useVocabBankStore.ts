"use client";

import { create } from "zustand";
import type {
  VocabBankConfig,
  VocabBankData,
  VocabBankItem,
} from "@gyoanmaker/shared/types";

interface VocabBankState {
  vocabBankData: VocabBankData | null;
  isGenerating: boolean;
  generateError: string | null;
  config: VocabBankConfig;
  includeInCompile: boolean;

  setVocabBankData: (data: VocabBankData) => void;
  setGenerating: (value: boolean) => void;
  setGenerateError: (error: string | null) => void;
  setIncludeInCompile: (value: boolean) => void;
  updateConfig: (partial: Partial<VocabBankConfig>) => void;
  updateItem: (
    itemIndex: number,
    updater: (item: VocabBankItem) => VocabBankItem
  ) => void;
  resetVocabBank: () => void;
}

const DEFAULT_CONFIG: VocabBankConfig = {
  sheetCode: "00",
  sheetTitle: "VOCA",
  rangeDescription: "",
  teacherName: "",
};

export const useVocabBankStore = create<VocabBankState>((set) => ({
  vocabBankData: null,
  isGenerating: false,
  generateError: null,
  config: { ...DEFAULT_CONFIG },
  includeInCompile: true,

  setVocabBankData: (data) => set({ vocabBankData: data }),
  setGenerating: (value) => set({ isGenerating: value }),
  setGenerateError: (error) => set({ generateError: error }),
  setIncludeInCompile: (value) => set({ includeInCompile: value }),
  updateConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        ...partial,
      },
    })),

  updateItem: (itemIndex, updater) =>
    set((state) => {
      if (!state.vocabBankData) return state;

      return {
        vocabBankData: {
          ...state.vocabBankData,
          items: state.vocabBankData.items.map((item, index) =>
            index !== itemIndex ? item : updater(item)
          ),
        },
      };
    }),

  resetVocabBank: () =>
    set({
      vocabBankData: null,
      isGenerating: false,
      generateError: null,
      includeInCompile: true,
      config: { ...DEFAULT_CONFIG },
    }),
}));
