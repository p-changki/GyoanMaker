"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HandoutSection } from "@/types/handout";
import {
  DEFAULT_CUSTOM_HEADER_TEXT,
  DEFAULT_ANALYSIS_TITLE_TEXT,
  DEFAULT_SUMMARY_TITLE_TEXT,
  useHandoutStore,
  useSection,
} from "@/stores/useHandoutStore";

const HEADER_TEXT_STORAGE_KEY = "gyoanmaker:header-text";
const ANALYSIS_TITLE_STORAGE_KEY = "gyoanmaker:analysis-title";
const SUMMARY_TITLE_STORAGE_KEY = "gyoanmaker:summary-title";

function normalizeHeaderText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_CUSTOM_HEADER_TEXT;
  }
  return normalized.slice(0, 40);
}

function normalizeAnalysisTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_ANALYSIS_TITLE_TEXT;
  }
  return normalized.slice(0, 80);
}

function normalizeSummaryTitle(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return DEFAULT_SUMMARY_TITLE_TEXT;
  }
  return normalized.slice(0, 40);
}

const ids = Array.from(
  { length: 20 },
  (_, i) => `P${String(i + 1).padStart(2, "0")}`
);

export default function PreviewCanvas() {
  const setCustomHeaderText = useHandoutStore(
    (state) => state.setCustomHeaderText
  );
  const setAnalysisTitleText = useHandoutStore(
    (state) => state.setAnalysisTitleText
  );
  const setSummaryTitleText = useHandoutStore(
    (state) => state.setSummaryTitleText
  );

  useEffect(() => {
    const storedHeader = sessionStorage.getItem(HEADER_TEXT_STORAGE_KEY);
    if (storedHeader) {
      setCustomHeaderText(normalizeHeaderText(storedHeader));
    }

    const storedTitle = sessionStorage.getItem(ANALYSIS_TITLE_STORAGE_KEY);
    if (storedTitle) {
      setAnalysisTitleText(normalizeAnalysisTitle(storedTitle));
    }

    const storedSummaryTitle = sessionStorage.getItem(
      SUMMARY_TITLE_STORAGE_KEY
    );
    if (storedSummaryTitle) {
      setSummaryTitleText(normalizeSummaryTitle(storedSummaryTitle));
    }
  }, [setCustomHeaderText, setAnalysisTitleText, setSummaryTitleText]);

  return (
    <div
      id="preview-canvas-root"
      className="h-full overflow-auto bg-[#F9FAFB] px-8 py-6"
    >
      <div className="w-full space-y-12">
        {ids.map((id) => (
          <SectionCanvasItem key={id} id={id} />
        ))}
      </div>
    </div>
  );
}

const SectionCanvasItem = memo(function SectionCanvasItem({
  id,
}: {
  id: string;
}) {
  const section = useSection(id);
  const isActive = useHandoutStore((state) => state.activeId === id);

  if (!section?.isParsed) {
    return (
      <div
        id={`section-${id}`}
        className={`bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col transition-all duration-500 ${
          isActive ? "ring-4 ring-[#5E35B1]/20 scale-[1.01]" : "opacity-90"
        }`}
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
      >
        <EmptyHandoutView id={id} rawText={section?.rawText} />
      </div>
    );
  }

  // 문장을 7개 단위로 청크(chunk) 분할
  const sentences = section.sentences || [];
  const chunkSize = 7;
  const sentenceChunks = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    sentenceChunks.push(sentences.slice(i, i + chunkSize));
  }

  // 문장이 아예 없을 경우 최소 1페이지 보장
  if (sentenceChunks.length === 0) {
    sentenceChunks.push([]);
  }

  const sentencePages = sentenceChunks.map((chunk, chunkIdx) => ({
    chunk,
    pageNum: chunkIdx + 1,
  }));

  return (
    <div
      className={`flex flex-col gap-12 transition-all duration-500 ${
        isActive ? "ring-4 ring-[#5E35B1]/20 scale-[1.01]" : "opacity-90"
      }`}
      data-export-id={id}
    >
      {/* 1페이지들을 청크 개수만큼 반복 생성 */}
      {sentencePages.map((page) => (
        <div
          key={`${id}-page1-${page.pageNum}`}
          id={`section-${id}-page1-${page.pageNum}`}
          data-pdf-part={`page1-${page.pageNum}`}
          className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
          style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
        >
          <ParsedHandoutViewPage1
            section={section}
            sentencesChunk={page.chunk}
            pageNum={page.pageNum}
          />
        </div>
      ))}

      {/* 마지막 핵심 요약 페이지 (pageNum은 앞의 1페이지 개수 + 1) */}
      <div
        id={`section-${id}-page2`}
        data-pdf-part="page2"
        className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
      >
        <ParsedHandoutViewPage2
          section={section}
          pageNum={sentenceChunks.length + 1}
        />
      </div>
    </div>
  );
});

function HandoutHeader({ section }: { section: HandoutSection }) {
  return (
    <header className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 bg-[#FFE4E1] shrink-0">
      <div className="flex items-end justify-between pb-4 pt-6 gap-4">
        <div className="flex flex-col relative flex-1 h-[56px]">
          {/* 01 Badge extending from top edge */}
          <div className="absolute -top-[45px] left-0 bg-[#D1D5DB] rounded-b-[1.25rem] w-[64px] h-[60px] rounded-tr-none z-0 translate-x-2 translate-y-2" />
          <div
            className="absolute -top-[45px] left-0 bg-[#5E35B1] rounded-b-[1.25rem] rounded-tr-none w-[64px] h-[60px] flex items-center justify-center z-10"
            style={{
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            }}
          >
            <span className="text-white text-[36px] font-black tracking-tighter leading-none mt-1">
              {section.passageId.slice(1).padStart(2, "0")}
            </span>
          </div>

          {/* Logic Title */}
          <h1
            className="absolute bottom-0 left-0 text-[#5E35B1] tracking-tighter leading-none"
            style={{ fontFamily: "GmarketSans, sans-serif" }}
          >
            <span className="text-[36px] font-bold">L</span>
            <span className="text-[36px] font-medium">ogic</span>
          </h1>
        </div>
        <div className="bg-[#5E35B1] px-4 py-1.5 text-white text-[13px] font-bold shrink-0 whitespace-nowrap translate-y-4 relative z-20">
          <EditableHeaderText />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#5E35B1]" />
    </header>
  );
}

function HandoutFooter({
  section,
  pageNum,
}: {
  section: HandoutSection;
  pageNum: number;
}) {
  return (
    <footer className="mt-auto pt-10 flex items-center justify-end shrink-0">
      <span className="text-xs font-black text-[#E5E7EB]">
        PAGE {section.passageId.slice(1)}-{pageNum}
      </span>
    </footer>
  );
}

function ParsedHandoutViewPage1({
  section,
  sentencesChunk,
  pageNum,
}: {
  section: HandoutSection;
  sentencesChunk: { en: string; ko: string }[];
  pageNum: number;
}) {
  return (
    <div className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative">
      <HandoutHeader section={section} />

      {/* 1. Sentence Analysis (PDF Matching) */}
      <section className="mb-8 relative flex-1 w-full">
        <div className="inline-flex items-center justify-center bg-white text-[#5E35B1] text-sm font-bold px-3 py-1.5 border border-[#5E35B1] rounded-full mb-3 z-10 relative leading-none">
          <span className="translate-y-px">
            <EditableAnalysisTitle pageNum={pageNum} />
          </span>
        </div>

        {/* Continuous Row Grid with Pink Background for Korean */}
        <div className="border-t-[3px] border-b-[3px] border-[#5E35B1] w-full">
          <div className="flex relative w-full">
            {/* Right Pink Background */}
            <div className="absolute top-0 right-0 w-[35%] h-full bg-[#FFE8E8]/50" />

            <div className="flex flex-col w-full relative z-10 divide-y divide-[#E5E7EB]">
              {sentencesChunk.map((pair, i) => (
                <div
                  key={`${pair.en}-${pair.ko}-${i}`}
                  className="flex min-h-[60px] w-full"
                >
                  {/* English (65%) */}
                  <div className="w-[65%] flex py-4 pr-6">
                    <div className="w-8 shrink-0 text-[14px] font-black text-[#5E35B1] pt-0.5">
                      {String((pageNum - 1) * 7 + i + 1).padStart(2, "0")}
                    </div>
                    <div
                      className="flex-1 text-[10pt] font-normal text-[#111827] leading-[2.1]"
                      style={{
                        fontFamily:
                          '"Pretendard Variable", Pretendard, sans-serif',
                      }}
                    >
                      {pair.en.replace(
                        /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴\s]+/,
                        ""
                      )}
                    </div>
                  </div>

                  {/* Korean (35%) */}
                  <div className="w-[35%] py-4 pl-6 pr-4">
                    <div
                      className="text-[8pt] font-normal text-[#1F2937] leading-[2.1]"
                      style={{
                        fontFamily:
                          '"Pretendard Variable", Pretendard, sans-serif',
                      }}
                    >
                      {pair.ko.replace(
                        /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴\s]+/,
                        ""
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}

function ParsedHandoutViewPage2({
  section,
  pageNum,
}: {
  section: HandoutSection;
  pageNum: number;
}) {
  return (
    <div className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative">
      {/* Summary Banner & Sections */}
      <section className="mb-14 relative flex-1 w-full">
        <div
          className="relative mb-10 h-12 bg-[#5E35B1] rounded-r-xl flex items-center pr-10 w-[95%] mt-6"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          }}
        >
          {/* The Avatar overlapping the top left edge */}
          <div className="absolute -top-[40px] left-6 w-[90px] h-[90px] z-20">
            <img
              src="/images/avatar.png"
              alt="Teacher Avatar"
              className="w-full h-full object-contain"
              style={{
                filter:
                  "drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))",
              }}
            />
          </div>
          <span className="text-white text-[15px] font-black tracking-wide ml-32 z-30">
            <EditableSummaryTitleText />
          </span>
        </div>

        <div className="space-y-8 pl-2">
          {/* Topic */}
          <div>
            <div
              className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            >
              <h3
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: "GmarketSans, sans-serif" }}
              >
                주제
              </h3>
            </div>
            <div className="pl-1">
              <p className="text-[10pt] font-bold text-[#111827] mb-1 leading-relaxed">
                {section.topic.en}
              </p>
              <p className="text-[8pt] font-medium text-[#374151] tracking-tight">
                {section.topic.ko}
              </p>
            </div>
          </div>

          {/* Summary */}
          {section.summary?.en && (
            <div>
              <div
                className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
                style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
              >
                <h3
                  className="text-[13px] font-bold text-white leading-none"
                  style={{ fontFamily: "GmarketSans, sans-serif" }}
                >
                  요약
                </h3>
              </div>
              <div className="pl-1">
                <p className="text-[10pt] font-normal text-[#111827] mb-1 leading-relaxed">
                  {section.summary.en}
                </p>
                <p className="text-[8pt] font-medium text-[#374151] tracking-tight">
                  {section.summary.ko}
                </p>
              </div>
            </div>
          )}

          {/* Flow */}
          <div>
            <div
              className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            >
              <h3
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: "GmarketSans, sans-serif" }}
              >
                내용 정리
              </h3>
            </div>
            <div className="pl-1 space-y-2">
              {section.flow.map((step) => (
                <div
                  key={step.text}
                  className="bg-[#FFE8E8]/60 px-3 py-2 rounded-md text-[11.5px] font-bold text-[#1F2937] text-center"
                >
                  {step.text}
                </div>
              ))}
            </div>
          </div>

          {/* Vocab Table */}
          <div>
            <div
              className="inline-flex items-center justify-center bg-[#5E35B1] px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
              style={{ boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
            >
              <h3
                className="text-[13px] font-bold text-white leading-none"
                style={{ fontFamily: "GmarketSans, sans-serif" }}
              >
                핵심 어휘
              </h3>
            </div>

            <table className="w-full text-left border-collapse border-t-[3px] border-b-[3px] border-[#5E35B1]">
              <thead>
                <tr className="bg-[#5E35B1] text-white text-[11.5px] font-bold">
                  <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">
                    핵심 어휘
                  </th>
                  <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">
                    뜻
                  </th>
                  <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">
                    유의어
                  </th>
                  <th className="px-3 py-2 w-[25%]">반의어</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {section.vocabulary
                  .filter((vocab) => vocab.word !== "핵심 어휘 및 확장")
                  .map((vocab, index) => (
                    <tr
                      key={`${vocab.word}-${vocab.meaning}`}
                      className={`border-b border-[#5E35B1]/20 text-[11.5px] ${index % 2 === 1 ? "bg-[#F9FAFB]/50" : ""}`}
                    >
                      <td className="px-3 py-2 text-[#111827] font-bold border-r border-[#5E35B1]/20">
                        {vocab.word}
                      </td>
                      <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-[#5E35B1]/20">
                        {vocab.meaning}
                      </td>
                      <td className="px-3 py-2 text-[#4B5563] border-r border-[#5E35B1]/20 align-middle font-normal">
                        {vocab.synonyms.length > 0
                          ? vocab.synonyms.map((s) => (
                              <div
                                key={`syn-${vocab.word}-${s.word}-${s.meaning}`}
                                className="mb-1 last:mb-0"
                              >
                                {s.word} {s.meaning}
                              </div>
                            ))
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
                        {vocab.antonyms.length > 0
                          ? vocab.antonyms.map((a) => (
                              <div
                                key={`ant-${vocab.word}-${a.word}-${a.meaning}`}
                                className="mb-1 last:mb-0"
                              >
                                {a.word} {a.meaning}
                              </div>
                            ))
                          : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}

const EditableHeaderText = memo(function EditableHeaderText() {
  const customHeaderText = useHandoutStore((state) => state.customHeaderText);
  const setCustomHeaderText = useHandoutStore(
    (state) => state.setCustomHeaderText
  );

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
      className="bg-transparent border-0 p-0 m-0 text-white text-[14px] font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
      style={{ fontFamily: "GmarketSans, sans-serif" }}
      aria-label="헤더 텍스트 편집"
    >
      {customHeaderText}
    </button>
  );
});

function EmptyHandoutView({ id, rawText }: { id: string; rawText?: string }) {
  return (
    <div className="p-16 flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="w-24 h-24 bg-[#F9FAFB] rounded-3xl flex items-center justify-center text-3xl font-black text-[#E5E7EB] border-2 border-dashed border-[#E5E7EB]">
        {id}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-[#9CA3AF] tracking-tight">
          지문 내용을 기다리는 중
        </h3>
        <p className="text-sm text-[#D1D5DB] font-bold max-w-sm">
          우측 상단의 [템플릿 적용] 버튼을 눌러 교안을 완성해주세요.
        </p>
      </div>

      {rawText && (
        <div className="w-full mt-10 p-6 bg-[#F9FAFB]/50 rounded-2xl border border-[#F3F4F6] text-left overflow-hidden opacity-30 select-none">
          <p className="text-[10px] text-[#9CA3AF] font-mono line-clamp-6">
            {rawText}
          </p>
        </div>
      )}
    </div>
  );
}

const EditableAnalysisTitle = memo(function EditableAnalysisTitle({
  pageNum,
}: {
  pageNum: number;
}) {
  const analysisTitleText = useHandoutStore((state) => state.analysisTitleText);
  const setAnalysisTitleText = useHandoutStore(
    (state) => state.setAnalysisTitleText
  );

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
      className="bg-transparent border-0 p-0 m-0 text-[#5E35B1] font-bold hover:opacity-80 transition-opacity"
      aria-label="구문 분석 제목 편집"
    >
      {analysisTitleText} {pageNum > 1 ? `(계속)` : ""}
    </button>
  );
});

const EditableSummaryTitleText = memo(function EditableSummaryTitleText() {
  const summaryTitleText = useHandoutStore((state) => state.summaryTitleText);
  const setSummaryTitleText = useHandoutStore(
    (state) => state.setSummaryTitleText
  );

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
      className="bg-transparent border-0 p-0 m-0 text-white text-[15px] font-black tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap"
      aria-label="요약 제목 편집"
    >
      {summaryTitleText}
    </button>
  );
});
