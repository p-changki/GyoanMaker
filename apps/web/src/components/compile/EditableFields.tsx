"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_ANALYSIS_TITLE_TEXT,
  DEFAULT_CUSTOM_HEADER_TEXT,
  DEFAULT_SUMMARY_TITLE_TEXT,
  useHandoutStore,
} from "@/stores/useHandoutStore";
import { PencilHintIcon } from "./EditableHintBanner";

export const HEADER_TEXT_STORAGE_KEY = "gyoanmaker:header-text";
export const ANALYSIS_TITLE_STORAGE_KEY = "gyoanmaker:analysis-title";
export const SUMMARY_TITLE_STORAGE_KEY = "gyoanmaker:summary-title";

export function normalizeHeaderText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_CUSTOM_HEADER_TEXT;
  }
  return normalized.slice(0, 40);
}

export function normalizeAnalysisTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_ANALYSIS_TITLE_TEXT;
  }
  return normalized.slice(0, 80);
}

export function normalizeSummaryTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_SUMMARY_TITLE_TEXT;
  }
  return normalized.slice(0, 40);
}

export const EditableHeaderText = memo(function EditableHeaderText() {
  const customHeaderText = useHandoutStore((state) => state.customHeaderText);
  const setCustomHeaderText = useHandoutStore((state) => state.setCustomHeaderText);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(customHeaderText);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      const length = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const nextValue = normalizeHeaderText(draft);
    setCustomHeaderText(nextValue);
    sessionStorage.setItem(HEADER_TEXT_STORAGE_KEY, nextValue);
    setIsEditing(false);
  }, [draft, setCustomHeaderText]);

  const handleCancel = useCallback(() => {
    setDraft(customHeaderText);
    setIsEditing(false);
  }, [customHeaderText]);

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        ref={inputRef}
        maxLength={40}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            handleCancel();
          }
        }}
        className="w-full bg-transparent text-white text-[14px] font-bold outline-none border-0 p-0 m-0 text-center"
        style={{ fontFamily: "GmarketSans, sans-serif" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(customHeaderText);
        setIsEditing(true);
      }}
      className="group/edit bg-transparent border-0 p-0 m-0 text-white text-[14px] font-bold hover:opacity-90 transition-opacity whitespace-nowrap inline-flex items-center gap-1.5"
      style={{ fontFamily: "GmarketSans, sans-serif" }}
      aria-label="Edit header text"
    >
      <span className="border-b border-dashed border-transparent group-hover/edit:border-white/60 transition-colors">
        {customHeaderText}
      </span>
      <PencilHintIcon className="text-white/0 group-hover/edit:text-white/70" />
    </button>
  );
});

export const EditableAnalysisTitle = memo(function EditableAnalysisTitle({
  pageNum,
}: {
  pageNum: number;
}) {
  const analysisTitleText = useHandoutStore((state) => state.analysisTitleText);
  const setAnalysisTitleText = useHandoutStore((state) => state.setAnalysisTitleText);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(analysisTitleText);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      const length = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const nextValue = normalizeAnalysisTitle(draft);
    setAnalysisTitleText(nextValue);
    sessionStorage.setItem(ANALYSIS_TITLE_STORAGE_KEY, nextValue);
    setIsEditing(false);
  }, [draft, setAnalysisTitleText]);

  const handleCancel = useCallback(() => {
    setDraft(analysisTitleText);
    setIsEditing(false);
  }, [analysisTitleText]);

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        ref={inputRef}
        maxLength={80}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            handleCancel();
          }
        }}
        className="bg-transparent text-[#5E35B1] font-bold outline-none flex-1 p-0 m-0 min-w-[150px] text-center"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(analysisTitleText);
        setIsEditing(true);
      }}
      className="group/edit bg-transparent border-0 p-0 m-0 text-[#5E35B1] font-bold hover:opacity-80 transition-opacity inline-flex items-center gap-1.5"
      aria-label="Edit analysis title"
    >
      <span className="border-b border-dashed border-transparent group-hover/edit:border-[#5E35B1]/40 transition-colors">
        {analysisTitleText} {pageNum > 1 ? "(cont.)" : ""}
      </span>
      <PencilHintIcon className="text-[#5E35B1]/0 group-hover/edit:text-[#5E35B1]/50" />
    </button>
  );
});

export const EditableSummaryTitleText = memo(function EditableSummaryTitleText() {
  const summaryTitleText = useHandoutStore((state) => state.summaryTitleText);
  const setSummaryTitleText = useHandoutStore((state) => state.setSummaryTitleText);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(summaryTitleText);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      const length = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const commitEdit = useCallback(() => {
    const nextValue = normalizeSummaryTitle(draft);
    setSummaryTitleText(nextValue);
    sessionStorage.setItem(SUMMARY_TITLE_STORAGE_KEY, nextValue);
    setIsEditing(false);
  }, [draft, setSummaryTitleText]);

  const handleCancel = useCallback(() => {
    setDraft(summaryTitleText);
    setIsEditing(false);
  }, [summaryTitleText]);

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        ref={inputRef}
        maxLength={40}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            handleCancel();
          }
        }}
        className="bg-transparent text-white text-[15px] font-black tracking-wide outline-none border-0 p-0 m-0 w-[200px]"
        style={{ fontFamily: "GmarketSans, sans-serif" }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(summaryTitleText);
        setIsEditing(true);
      }}
      className="group/edit bg-transparent border-0 p-0 m-0 text-white text-[15px] font-black tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap inline-flex items-center gap-1.5"
      aria-label="Edit summary title"
    >
      <span className="border-b border-dashed border-transparent group-hover/edit:border-white/60 transition-colors">
        {summaryTitleText}
      </span>
      <PencilHintIcon className="text-white/0 group-hover/edit:text-white/70" />
    </button>
  );
});

export const AnalysisTitle = EditableAnalysisTitle;
export const SummaryTitle = EditableSummaryTitleText;
