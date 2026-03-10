"use client";

import { create } from "zustand";
import type {
  WorkbookConfig,
  WorkbookData,
  WorkbookStep2Item,
  WorkbookStep3Item,
} from "@gyoanmaker/shared/types";

interface WorkbookState {
  workbookData: WorkbookData | null;
  isGenerating: boolean;
  generateError: string | null;
  selectedModel: "flash" | "pro";
  config: WorkbookConfig;
  includeInCompile: boolean;

  setWorkbookData: (data: WorkbookData) => void;
  setGenerating: (value: boolean) => void;
  setGenerateError: (error: string | null) => void;
  setSelectedModel: (model: "flash" | "pro") => void;
  setIncludeInCompile: (value: boolean) => void;
  updateConfig: (partial: Partial<WorkbookConfig>) => void;
  updateStep2Item: (
    passageId: string,
    questionNumber: number,
    updater: (item: WorkbookStep2Item) => WorkbookStep2Item
  ) => void;
  updateStep3Item: (
    passageId: string,
    questionNumber: number,
    updater: (item: WorkbookStep3Item) => WorkbookStep3Item
  ) => void;
  resetWorkbook: () => void;
}

const DEFAULT_CONFIG: WorkbookConfig = {
  testCode: "01",
  testTitle: "Upgrade",
  rangeDescription: "",
  teacherName: "",
};

export const useWorkbookStore = create<WorkbookState>((set) => ({
  workbookData: null,
  isGenerating: false,
  generateError: null,
  selectedModel: "flash",
  config: { ...DEFAULT_CONFIG },
  includeInCompile: true,

  setWorkbookData: (data) => set({ workbookData: data }),
  setGenerating: (value) => set({ isGenerating: value }),
  setGenerateError: (error) => set({ generateError: error }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIncludeInCompile: (value) => set({ includeInCompile: value }),
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  updateStep2Item: (passageId, questionNumber, updater) =>
    set((state) => {
      if (!state.workbookData) return state;

      return {
        workbookData: {
          ...state.workbookData,
          passages: state.workbookData.passages.map((passage) =>
            passage.passageId !== passageId
              ? passage
              : {
                  ...passage,
                  step2Items: passage.step2Items.map((item) =>
                    item.questionNumber !== questionNumber ? item : updater(item)
                  ),
                }
          ),
        },
      };
    }),

  updateStep3Item: (passageId, questionNumber, updater) =>
    set((state) => {
      if (!state.workbookData) return state;

      return {
        workbookData: {
          ...state.workbookData,
          passages: state.workbookData.passages.map((passage) =>
            passage.passageId !== passageId
              ? passage
              : {
                  ...passage,
                  step3Items: passage.step3Items.map((item) =>
                    item.questionNumber !== questionNumber ? item : updater(item)
                  ),
                }
          ),
        },
      };
    }),

  resetWorkbook: () =>
    set({
      workbookData: null,
      isGenerating: false,
      generateError: null,
      selectedModel: "flash",
      includeInCompile: true,
      config: { ...DEFAULT_CONFIG },
    }),
}));
