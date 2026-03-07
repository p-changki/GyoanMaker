"use client";

import { create } from "zustand";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";

export type EditorFocus = "global" | "header" | "header-badge" | "page2-header" | "page1-body" | Page2SectionKey;

interface EditorFocusStore {
  focus: EditorFocus;
  setFocus: (focus: EditorFocus) => void;
}

export const useEditorFocusStore = create<EditorFocusStore>((set) => ({
  focus: "global",
  setFocus: (focus) => set({ focus }),
}));
