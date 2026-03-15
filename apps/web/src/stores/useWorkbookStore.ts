"use client";

import { create } from "zustand";
import type {
  WorkbookConfig,
  WorkbookData,
  WorkbookStep2Item,
  WorkbookStep3Item,
} from "@gyoanmaker/shared/types";

// --- Helper functions for STEP 3 options recalculation ---

function step3Permutations(items: string[]): string[][] {
  if (items.length <= 1) return [items];
  const result: string[][] = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    step3Permutations(rest).forEach((entry) => result.push([item, ...entry]));
  });
  return result;
}

function recalcStep3Options(correctOrder: string[]): {
  options: string[][];
  answerIndex: number;
} {
  const correctKey = correctOrder.join("-");
  const allPerms = step3Permutations([...correctOrder]);

  const adjacentSwaps: string[][] = [];
  for (let i = 0; i < correctOrder.length - 1; i++) {
    const swapped = [...correctOrder];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    if (swapped.join("-") !== correctKey) adjacentSwaps.push(swapped);
  }

  const seen = new Set<string>([correctKey]);
  const distractorPool: string[][] = [];

  const pushDistractor = (v: string[]) => {
    const key = v.join("-");
    if (seen.has(key)) return;
    seen.add(key);
    distractorPool.push(v);
  };

  adjacentSwaps.forEach(pushDistractor);
  allPerms.forEach(pushDistractor);

  const chosen = distractorPool.slice(0, 4);
  const insertPos = Math.floor(Math.random() * (chosen.length + 1));
  chosen.splice(insertPos, 0, [...correctOrder]);
  const finalOptions = chosen.slice(0, 5);

  const answerIndex = finalOptions.findIndex((o) => o.join("-") === correctKey);
  return { options: finalOptions, answerIndex: answerIndex >= 0 ? answerIndex : 0 };
}

// --- Store interface ---

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
    updater: (item: WorkbookStep2Item) => WorkbookStep2Item,
  ) => void;
  updateStep3Item: (
    passageId: string,
    questionNumber: number,
    updater: (item: WorkbookStep3Item) => WorkbookStep3Item,
  ) => void;
  /**
   * Reorder paragraphs by specifying old labels in the new correct reading order.
   * e.g. newLabelOrder=["C","A","B"] means C→A→B is the correct reading sequence.
   * Labels are reassigned alphabetically (A, B, C, ...) and options recalculated.
   */
  reorderStep3Paragraphs: (
    passageId: string,
    questionNumber: number,
    newLabelOrder: string[],
  ) => void;
  setStep3AnswerIndex: (
    passageId: string,
    questionNumber: number,
    newAnswerIndex: number,
  ) => void;
  addStep3Item: (passageId: string, item: WorkbookStep3Item) => void;
  removeStep3Item: (passageId: string, questionNumber: number) => void;
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
                    item.questionNumber !== questionNumber ? item : updater(item),
                  ),
                },
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
                    item.questionNumber !== questionNumber ? item : updater(item),
                  ),
                },
          ),
        },
      };
    }),

  reorderStep3Paragraphs: (passageId, questionNumber, newLabelOrder) =>
    set((state) => {
      if (!state.workbookData) return state;
      return {
        workbookData: {
          ...state.workbookData,
          passages: state.workbookData.passages.map((passage) => {
            if (passage.passageId !== passageId) return passage;
            return {
              ...passage,
              step3Items: passage.step3Items.map((item) => {
                if (item.questionNumber !== questionNumber) return item;

                // Build map of old label → text
                const textByLabel = new Map(item.paragraphs.map((p) => [p.label, p.text]));

                // newLabelOrder represents correct reading sequence using OLD labels.
                // Reassign to A, B, C, D (first in correct order → A, second → B, ...)
                const newLabels = ["A", "B", "C", "D"];
                const newParagraphs = newLabelOrder
                  .map((oldLabel, idx) => ({
                    label: newLabels[idx],
                    text: textByLabel.get(oldLabel) ?? "",
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label));

                // After relabeling, the correct reading order is always A→B→C(→D)
                const correctOrder = newLabels.slice(0, newLabelOrder.length);
                const { options, answerIndex } = recalcStep3Options(correctOrder);

                return { ...item, paragraphs: newParagraphs, options, answerIndex };
              }),
            };
          }),
        },
      };
    }),

  setStep3AnswerIndex: (passageId, questionNumber, newAnswerIndex) =>
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
                    item.questionNumber !== questionNumber
                      ? item
                      : { ...item, answerIndex: newAnswerIndex },
                  ),
                },
          ),
        },
      };
    }),

  addStep3Item: (passageId, item) =>
    set((state) => {
      if (!state.workbookData) return state;
      return {
        workbookData: {
          ...state.workbookData,
          passages: state.workbookData.passages.map((passage) =>
            passage.passageId !== passageId
              ? passage
              : { ...passage, step3Items: [...passage.step3Items, item] },
          ),
        },
      };
    }),

  removeStep3Item: (passageId, questionNumber) =>
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
                  step3Items: passage.step3Items.filter(
                    (item) => item.questionNumber !== questionNumber,
                  ),
                },
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
