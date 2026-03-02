"use client";

import { create } from "zustand";
import { CompiledHandout, HandoutSection } from "@/types/handout";

export const DEFAULT_CUSTOM_HEADER_TEXT = "고1 25년 9월 모의고사";

interface HandoutStoreState {
  sections: Record<string, HandoutSection>;
  activeId: string;
  isApplying: boolean;
  progress: number;
  total: number;
  customHeaderText: string;
}

interface HandoutStoreActions {
  setCompiledData: (sections: CompiledHandout["sections"]) => void;
  setActiveId: (id: string) => void;
  updateSection: (id: string, section: HandoutSection) => void;
  setApplying: (isApplying: boolean) => void;
  setProgress: (progress: number) => void;
  setCustomHeaderText: (text: string) => void;
}

type HandoutStore = HandoutStoreState & HandoutStoreActions;

export const useHandoutStore = create<HandoutStore>((set) => ({
  sections: {},
  activeId: "P01",
  isApplying: false,
  progress: 0,
  total: 20,
  customHeaderText: DEFAULT_CUSTOM_HEADER_TEXT,

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
}));

export function useSection(id: string): HandoutSection | undefined {
  return useHandoutStore((state) => state.sections[id]);
}
