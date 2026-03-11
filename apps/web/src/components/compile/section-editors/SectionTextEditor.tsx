"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorFocus } from "@/stores/useEditorFocusStore";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import {
  normalizeHeaderText,
  normalizeAnalysisTitle,
  normalizeSummaryTitle,
  HEADER_TEXT_STORAGE_KEY,
  ANALYSIS_TITLE_STORAGE_KEY,
  SUMMARY_TITLE_STORAGE_KEY,
} from "../EditableFields";
import { DEFAULT_SECTION_TITLES, isBuiltInSectionKey } from "@gyoanmaker/shared/types";
import type { Page2SectionKey, CustomSectionKey, BuiltInSectionKey } from "@gyoanmaker/shared/types";

interface Props {
  sectionKey: EditorFocus;
}

export function SectionTextEditor({ sectionKey }: Props) {
  switch (sectionKey) {
    case "header":
      return <AcademyNameEditor />;
    case "header-badge":
      return <HeaderBadgeTextEditor />;
    case "page1-title":
      return <AnalysisTitleTextEditor />;
    case "page2-header":
      return <SummaryTitleTextEditor />;
    default:
      if (sectionKey.startsWith("custom_")) {
        return <CustomSectionTextEditor sectionKey={sectionKey as CustomSectionKey} />;
      }
      return <SectionTitleEditor sectionKey={sectionKey as Page2SectionKey} />;
  }
}

/* ─── Academy Name ─── */

function AcademyNameEditor() {
  const academyName = useTemplateSettingsStore((s) => s.academyName);
  const setAcademyName = useTemplateSettingsStore((s) => s.setAcademyName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3 py-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
        학원명
      </label>
      <input
        ref={inputRef}
        type="text"
        value={academyName ?? ""}
        maxLength={20}
        placeholder="미입력 시 Logic"
        onChange={(e) => setAcademyName(e.target.value.trim() === "" ? null : e.target.value)}
        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] text-center"
      />
      <p className="text-[10px] text-gray-400">
        비워두면 기본 로고(Logic)가 표시됩니다. 최대 20자.
      </p>
    </div>
  );
}

/* ─── Header Badge Text ─── */

function HeaderBadgeTextEditor() {
  const customHeaderText = useHandoutStore((s) => s.customHeaderText);
  const setCustomHeaderText = useHandoutStore((s) => s.setCustomHeaderText);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(customHeaderText);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback((value: string) => {
    setLocalValue(value.slice(0, 40));
  }, []);

  const handleBlur = useCallback(() => {
    const next = normalizeHeaderText(localValue);
    setLocalValue(next);
    setCustomHeaderText(next);
    sessionStorage.setItem(HEADER_TEXT_STORAGE_KEY, next);
  }, [localValue, setCustomHeaderText]);

  return (
    <div className="space-y-3 py-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
        머리글 텍스트
      </label>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        maxLength={40}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] text-center"
      />
    </div>
  );
}

/* ─── Analysis Title ─── */

function AnalysisTitleTextEditor() {
  const passageId = useEditorFocusStore((s) => s.modalPassageId);
  const analysisTitleText = useHandoutStore((s) => s.analysisTitleText);
  const analysisTitleTexts = useHandoutStore((s) => s.analysisTitleTexts);
  const setAnalysisTitleText = useHandoutStore((s) => s.setAnalysisTitleText);
  const setPassageAnalysisTitleText = useHandoutStore((s) => s.setPassageAnalysisTitleText);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentValue = passageId
    ? (analysisTitleTexts[passageId] ?? analysisTitleText)
    : analysisTitleText;

  const [localValue, setLocalValue] = useState(currentValue);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback((value: string) => {
    setLocalValue(value.slice(0, 80));
  }, []);

  const handleBlur = useCallback(() => {
    const next = normalizeAnalysisTitle(localValue);
    setLocalValue(next);
    if (passageId) {
      setPassageAnalysisTitleText(passageId, next);
    } else {
      setAnalysisTitleText(next);
      sessionStorage.setItem(ANALYSIS_TITLE_STORAGE_KEY, next);
    }
  }, [localValue, passageId, setAnalysisTitleText, setPassageAnalysisTitleText]);

  return (
    <div className="space-y-3 py-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
        분석 타이틀{passageId ? ` (${passageId})` : ""}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        maxLength={80}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] text-center"
      />
      {passageId && analysisTitleTexts[passageId] && (
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1 py-px rounded">
            개별 설정
          </span>
          <button
            type="button"
            onClick={() => {
              setPassageAnalysisTitleText(passageId, "");
              setLocalValue(analysisTitleText);
            }}
            className="text-[9px] text-gray-400 hover:text-gray-600"
          >
            전체 기본값으로
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Title ─── */

function SummaryTitleTextEditor() {
  const summaryTitleText = useHandoutStore((s) => s.summaryTitleText);
  const setSummaryTitleText = useHandoutStore((s) => s.setSummaryTitleText);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(summaryTitleText);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback((value: string) => {
    setLocalValue(value.slice(0, 40));
  }, []);

  const handleBlur = useCallback(() => {
    const next = normalizeSummaryTitle(localValue);
    setLocalValue(next);
    setSummaryTitleText(next);
    sessionStorage.setItem(SUMMARY_TITLE_STORAGE_KEY, next);
  }, [localValue, setSummaryTitleText]);

  return (
    <div className="space-y-3 py-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
        요약 타이틀
      </label>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        maxLength={40}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] text-center"
      />
    </div>
  );
}

/* ─── Page2 Section Title ─── */

function SectionTitleEditor({ sectionKey }: { sectionKey: Page2SectionKey }) {
  const sectionTitles = useTemplateSettingsStore((s) => s.sectionTitles);
  const setSectionTitle = useTemplateSettingsStore((s) => s.setSectionTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultTitle = isBuiltInSectionKey(sectionKey)
    ? DEFAULT_SECTION_TITLES[sectionKey as BuiltInSectionKey]
    : "";
  const customTitle = sectionTitles?.[sectionKey] ?? "";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3 py-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
        섹션 타이틀
      </label>
      <input
        ref={inputRef}
        type="text"
        value={customTitle}
        placeholder={defaultTitle}
        onChange={(e) => setSectionTitle(sectionKey, e.target.value)}
        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1]"
      />
      {customTitle && (
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold text-[#5E35B1] bg-[#5E35B1]/10 px-1 py-px rounded">
            커스텀
          </span>
          <button
            type="button"
            onClick={() => setSectionTitle(sectionKey, "")}
            className="text-[9px] text-gray-400 hover:text-gray-600"
          >
            기본값으로
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Custom Section Title + Body ─── */

function CustomSectionTextEditor({ sectionKey }: { sectionKey: CustomSectionKey }) {
  const content = useTemplateSettingsStore((s) => s.customSections?.[sectionKey]);
  const setContent = useTemplateSettingsStore((s) => s.setCustomSectionContent);

  if (!content) return null;

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
          섹션 제목
        </label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => setContent(sectionKey, { title: e.target.value })}
          placeholder="섹션 제목 입력"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5E35B1] focus:border-[#5E35B1]"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
          본문 내용
        </label>
        <textarea
          value={content.body}
          onChange={(e) => setContent(sectionKey, { body: e.target.value })}
          placeholder="섹션 본문을 입력하세요..."
          rows={6}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5E35B1] focus:border-[#5E35B1] resize-y"
        />
      </div>
    </div>
  );
}
