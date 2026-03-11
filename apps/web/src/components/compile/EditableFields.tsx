"use client";

import { memo } from "react";
import {
  DEFAULT_CUSTOM_HEADER_TEXT,
  DEFAULT_ANALYSIS_TITLE_TEXT,
  DEFAULT_SUMMARY_TITLE_TEXT,
  useHandoutStore,
} from "@/stores/useHandoutStore";
import { PencilHintIcon } from "./EditableHintBanner";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";

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

/* ─── Editable Header Text ─── */

export const EditableHeaderText = memo(function EditableHeaderText() {
  const customHeaderText = useHandoutStore((state) => state.customHeaderText);
  const openModal = useEditorFocusStore((s) => s.openModal);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openModal("header-badge");
      }}
      className="group/edit bg-transparent border-0 p-0 m-0 text-[inherit] text-[1em] hover:opacity-90 transition-opacity whitespace-nowrap relative"
      style={{ fontFamily: "inherit", fontWeight: "inherit", display: "inline-block", verticalAlign: "middle" }}
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
  );
});

/* ─── Editable Analysis Title ─── */

export const EditableAnalysisTitle = memo(function EditableAnalysisTitle({ passageId }: { passageId: string }) {
  const analysisTitleText = useHandoutStore((state) => state.analysisTitleText);
  const analysisTitleTexts = useHandoutStore((state) => state.analysisTitleTexts);
  const openModal = useEditorFocusStore((s) => s.openModal);

  const displayText = analysisTitleTexts[passageId] ?? analysisTitleText;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openModal("page1-title", passageId);
      }}
      className="group/edit bg-transparent border-0 p-0 m-0 font-bold hover:opacity-80 transition-opacity relative"
      style={{ color: "inherit", display: "inline-block", verticalAlign: "middle" }}
      aria-label="분석 제목 편집"
    >
      <span className="border-b border-dashed border-transparent group-hover/edit:border-current/40 transition-colors">
        {displayText}
      </span>
      <span
        className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/edit:opacity-50 pointer-events-none"
        data-html2canvas-ignore="true"
      >
        <PencilHintIcon />
      </span>
    </button>
  );
});

/* ─── Editable Summary Title ─── */

export const EditableSummaryTitleText = memo(function EditableSummaryTitleText() {
  const summaryTitleText = useHandoutStore((state) => state.summaryTitleText);
  const openModal = useEditorFocusStore((s) => s.openModal);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openModal("page2-header");
      }}
      className="group/edit bg-transparent border-0 p-0 m-0 text-[inherit] text-[1em] tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap relative"
      style={{ fontWeight: "inherit", display: "inline-block", verticalAlign: "middle" }}
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
  );
});

export const AnalysisTitle = EditableAnalysisTitle;
export const SummaryTitle = EditableSummaryTitleText;
