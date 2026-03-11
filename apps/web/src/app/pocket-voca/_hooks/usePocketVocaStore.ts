"use client";

import { create } from "zustand";
import type { PocketVocaData, PocketVocaConfig } from "@gyoanmaker/shared/types";

const DEFAULT_CONFIG: PocketVocaConfig = {
  sheetCode: "PV1",
  sheetTitle: "포켓보카",
  sectionLabel: "포켓보카",
  rangeDescription: "",
  teacherName: "",
};

interface PocketVocaState {
  step: 1 | 2 | 3;
  selectedHandoutId: string | null;
  passageLabels: Record<string, string>; // passageId → custom label
  generatedData: PocketVocaData | null;
  isGenerating: boolean;
  config: PocketVocaConfig;

  setStep: (step: 1 | 2 | 3) => void;
  selectHandout: (id: string) => void;
  setPassageLabel: (passageId: string, label: string) => void;
  setGeneratedData: (data: PocketVocaData) => void;
  setIsGenerating: (v: boolean) => void;
  updateConfig: (partial: Partial<PocketVocaConfig>) => void;
  reset: () => void;
}

export const usePocketVocaStore = create<PocketVocaState>((set) => ({
  step: 1,
  selectedHandoutId: null,
  passageLabels: {},
  generatedData: null,
  isGenerating: false,
  config: { ...DEFAULT_CONFIG },

  setStep: (step) => set({ step }),
  selectHandout: (id) => set({ selectedHandoutId: id }),
  setPassageLabel: (passageId, label) =>
    set((state) => ({
      passageLabels: { ...state.passageLabels, [passageId]: label },
    })),
  setGeneratedData: (data) => set({ generatedData: data }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  reset: () =>
    set({
      step: 1,
      selectedHandoutId: null,
      passageLabels: {},
      generatedData: null,
      isGenerating: false,
      config: { ...DEFAULT_CONFIG },
    }),
}));
