"use client";

import { create } from "zustand";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";

export type EditorFocus = "global" | "header" | "header-badge" | "page1-title" | "page2-header" | "page1-body" | Page2SectionKey;

interface EditorFocusStore {
  /** @deprecated Kept for backward-compat; always "global" now. */
  focus: EditorFocus;
  /** @deprecated Use openModal instead. */
  setFocus: (focus: EditorFocus) => void;

  /** Currently open modal section key. null = no modal. */
  modalKey: EditorFocus | null;
  /** Open the section edit modal for the given key. */
  openModal: (key: EditorFocus) => void;
  /** Close the section edit modal. */
  closeModal: () => void;
}

export const useEditorFocusStore = create<EditorFocusStore>((set) => ({
  focus: "global",
  setFocus: (focus) => set({ focus }),

  modalKey: null,
  openModal: (key) => set({ modalKey: key }),
  closeModal: () => set({ modalKey: null }),
}));
