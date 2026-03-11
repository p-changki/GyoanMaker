"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DEFAULT_ANALYSIS_TITLE_TEXT,
  DEFAULT_CUSTOM_HEADER_TEXT,
  DEFAULT_SUMMARY_TITLE_TEXT,
  useHandoutStore,
} from "@/stores/useHandoutStore";
import { PencilHintIcon } from "./EditableHintBanner";
import { THEME_PRESETS } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";

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

/* ─── Reusable Edit Modal ─── */

function EditFieldModal({
  label,
  value,
  maxLength,
  themeColor = "#5E35B1",
  onConfirm,
  onClose,
}: {
  label: string;
  value: string;
  maxLength: number;
  themeColor?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const len = inputRef.current?.value.length ?? 0;
    inputRef.current?.setSelectionRange(len, len);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(draft);
  }, [draft, onConfirm]);

  return (
    createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] max-w-[90vw] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirm();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
          className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none text-center"
          style={{ ...(draft !== value ? {} : {}), }} // focus styles via onFocus
          onFocus={(e) => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.boxShadow = `0 0 0 1px ${themeColor}`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors"
            style={{ backgroundColor: themeColor }}
          >
            적용
          </button>
        </div>
      </div>
    </div>,
    document.body
    )
  );
}

/* ─── Editable Header Text ─── */

export const EditableHeaderText = memo(function EditableHeaderText() {
  const themePreset = useTemplateSettingsStore((s) => s.themePreset);
  const themeColor = THEME_PRESETS[themePreset].primary;
  const customHeaderText = useHandoutStore((state) => state.customHeaderText);
  const setCustomHeaderText = useHandoutStore((state) => state.setCustomHeaderText);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = useCallback(
    (value: string) => {
      const next = normalizeHeaderText(value);
      setCustomHeaderText(next);
      sessionStorage.setItem(HEADER_TEXT_STORAGE_KEY, next);
      setIsOpen(false);
    },
    [setCustomHeaderText]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group/edit bg-transparent border-0 p-0 m-0 text-[inherit] text-[1em] hover:opacity-90 transition-opacity whitespace-nowrap relative"
        style={{ fontFamily: "inherit", fontWeight: "inherit" }}
        aria-label="헤더 텍스트 편집"
      >
        <span className="border-b border-dashed border-transparent group-hover/edit:border-current/60 transition-colors">
          {customHeaderText}
        </span>
        <span
          className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/edit:opacity-70 pointer-events-none"
          data-html2canvas-ignore="true"
        >
          <PencilHintIcon />
        </span>
      </button>
      {isOpen && (
        <EditFieldModal
          label="머리글"
          value={customHeaderText}
          maxLength={40}
          themeColor={themeColor}
          onConfirm={handleConfirm}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
});

/* ─── Editable Analysis Title ─── */

export const EditableAnalysisTitle = memo(function EditableAnalysisTitle({
  pageNum,
}: {
  pageNum: number;
}) {
  const themePreset = useTemplateSettingsStore((s) => s.themePreset);
  const themeColor = THEME_PRESETS[themePreset].primary;
  const analysisTitleText = useHandoutStore((state) => state.analysisTitleText);
  const setAnalysisTitleText = useHandoutStore((state) => state.setAnalysisTitleText);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = useCallback(
    (value: string) => {
      const next = normalizeAnalysisTitle(value);
      setAnalysisTitleText(next);
      sessionStorage.setItem(ANALYSIS_TITLE_STORAGE_KEY, next);
      setIsOpen(false);
    },
    [setAnalysisTitleText]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group/edit bg-transparent border-0 p-0 m-0 font-bold hover:opacity-80 transition-opacity relative"
        style={{ color: "inherit" }}
        aria-label="분석 제목 편집"
      >
        <span className="border-b border-dashed border-transparent group-hover/edit:border-current/40 transition-colors">
          {analysisTitleText} {pageNum > 1 ? "(cont.)" : ""}
        </span>
        <span
          className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/edit:opacity-50 pointer-events-none"
          data-html2canvas-ignore="true"
        >
          <PencilHintIcon />
        </span>
      </button>
      {isOpen && (
        <EditFieldModal
          label="분석 제목"
          value={analysisTitleText}
          maxLength={80}
          themeColor={themeColor}
          onConfirm={handleConfirm}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
});

/* ─── Editable Summary Title ─── */

export const EditableSummaryTitleText = memo(function EditableSummaryTitleText() {
  const themePreset = useTemplateSettingsStore((s) => s.themePreset);
  const themeColor = THEME_PRESETS[themePreset].primary;
  const summaryTitleText = useHandoutStore((state) => state.summaryTitleText);
  const setSummaryTitleText = useHandoutStore((state) => state.setSummaryTitleText);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = useCallback(
    (value: string) => {
      const next = normalizeSummaryTitle(value);
      setSummaryTitleText(next);
      sessionStorage.setItem(SUMMARY_TITLE_STORAGE_KEY, next);
      setIsOpen(false);
    },
    [setSummaryTitleText]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group/edit bg-transparent border-0 p-0 m-0 text-[inherit] text-[1em] tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap relative"
        style={{ fontWeight: "inherit" }}
        aria-label="요약 제목 편집"
      >
        <span className="border-b border-dashed border-transparent group-hover/edit:border-current/60 transition-colors">
          {summaryTitleText}
        </span>
        <span
          className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/edit:opacity-70 pointer-events-none"
          data-html2canvas-ignore="true"
        >
          <PencilHintIcon />
        </span>
      </button>
      {isOpen && (
        <EditFieldModal
          label="요약 제목"
          value={summaryTitleText}
          maxLength={40}
          themeColor={themeColor}
          onConfirm={handleConfirm}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
});

export const AnalysisTitle = EditableAnalysisTitle;
export const SummaryTitle = EditableSummaryTitleText;
