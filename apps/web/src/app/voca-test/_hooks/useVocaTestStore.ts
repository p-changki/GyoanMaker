"use client";

import { create } from "zustand";
import type { TestConfig, VocaTestQuestion } from "./vocaTest.types";

const DEFAULT_CONFIG: TestConfig = {
  testCode: "VT1",
  rangeDescription: "",
  schoolName: "",
  testTitle: "VOCA TEST",
  teacherName: "",
  cutline: "",
};

interface VocaTestState {
  step: 1 | 2 | 3;
  selectedHandoutId: string | null;
  questionPool: VocaTestQuestion[];
  selectedQuestionIds: Set<string>;
  config: TestConfig;
  shuffleQuestions: boolean;

  setStep: (step: 1 | 2 | 3) => void;
  selectHandout: (id: string) => void;
  setQuestionPool: (questions: VocaTestQuestion[]) => void;
  toggleQuestion: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectByPassage: (passageId: string) => void;
  updateConfig: (partial: Partial<TestConfig>) => void;
  toggleShuffle: () => void;
  reset: () => void;
}

export const useVocaTestStore = create<VocaTestState>((set) => ({
  step: 1,
  selectedHandoutId: null,
  questionPool: [],
  selectedQuestionIds: new Set(),
  config: { ...DEFAULT_CONFIG },
  shuffleQuestions: false,

  setStep: (step) => set({ step }),
  selectHandout: (id) => set({ selectedHandoutId: id }),
  setQuestionPool: (questions) =>
    set({
      questionPool: questions,
      selectedQuestionIds: new Set(questions.map((q) => q.id)),
    }),
  toggleQuestion: (id) =>
    set((state) => {
      const next = new Set(state.selectedQuestionIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedQuestionIds: next };
    }),
  selectAll: () =>
    set((state) => ({
      selectedQuestionIds: new Set(state.questionPool.map((q) => q.id)),
    })),
  deselectAll: () => set({ selectedQuestionIds: new Set() }),
  selectByPassage: (passageId) =>
    set((state) => {
      const next = new Set(state.selectedQuestionIds);
      const passageQs = state.questionPool.filter(
        (q) => q.sourcePassageId === passageId
      );
      const allSelected = passageQs.every((q) => next.has(q.id));
      passageQs.forEach((q) => {
        if (allSelected) next.delete(q.id);
        else next.add(q.id);
      });
      return { selectedQuestionIds: next };
    }),
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  toggleShuffle: () =>
    set((state) => ({ shuffleQuestions: !state.shuffleQuestions })),
  reset: () =>
    set({
      step: 1,
      selectedHandoutId: null,
      questionPool: [],
      selectedQuestionIds: new Set(),
      config: { ...DEFAULT_CONFIG },
      shuffleQuestions: false,
    }),
}));
