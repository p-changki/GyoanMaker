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
  /** passageId for per-passage editors (e.g. page1-title). null = global. */
  modalPassageId: string | null;
  /** Open the section edit modal for the given key, optionally scoped to a passage. */
  openModal: (key: EditorFocus, passageId?: string) => void;
  /** Close the section edit modal. */
  closeModal: () => void;
}

export const useEditorFocusStore = create<EditorFocusStore>((set) => ({
  focus: "global",
  setFocus: (focus) => set({ focus }),

  modalKey: null,
  modalPassageId: null,
  openModal: (key, passageId) => set({ modalKey: key, modalPassageId: passageId ?? null }),
  closeModal: () => set({ modalKey: null, modalPassageId: null }),
}));
