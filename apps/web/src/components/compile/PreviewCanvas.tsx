"use client";

import { memo, useEffect, useMemo } from "react";
import type { HandoutSection } from "@gyoanmaker/shared/types";
import { useHandoutStore, useSection } from "@/stores/useHandoutStore";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useVocabBankStore } from "@/stores/useVocabBankStore";
import EditableHintBanner from "./EditableHintBanner";
import {
  ANALYSIS_TITLE_STORAGE_KEY,
  HEADER_TEXT_STORAGE_KEY,
  SUMMARY_TITLE_STORAGE_KEY,
  normalizeAnalysisTitle,
  normalizeHeaderText,
  normalizeSummaryTitle,
} from "./EditableFields";
import EmptyHandoutView from "./EmptyHandoutView";
import { ParsedHandoutViewPage1, ParsedHandoutViewPage2 } from "./HandoutViews";
import WorkbookSheetsForCompile from "./WorkbookSheetsForCompile";
import VocabBankSheetsForCompile, {
  getVocabBankPageCount,
} from "./VocabBankSheetsForCompile";

export default function PreviewCanvas() {
  const setCustomHeaderText = useHandoutStore((state) => state.setCustomHeaderText);
  const setAnalysisTitleText = useHandoutStore((state) => state.setAnalysisTitleText);
  const setSummaryTitleText = useHandoutStore((state) => state.setSummaryTitleText);

  useEffect(() => {
    const storedHeader = sessionStorage.getItem(HEADER_TEXT_STORAGE_KEY);
    if (storedHeader) {
      setCustomHeaderText(normalizeHeaderText(storedHeader));
    }

    const storedTitle = sessionStorage.getItem(ANALYSIS_TITLE_STORAGE_KEY);
    if (storedTitle) {
      setAnalysisTitleText(normalizeAnalysisTitle(storedTitle));
    }

    const storedSummaryTitle = sessionStorage.getItem(SUMMARY_TITLE_STORAGE_KEY);
    if (storedSummaryTitle) {
      setSummaryTitleText(normalizeSummaryTitle(storedSummaryTitle));
    }
  }, [setCustomHeaderText, setAnalysisTitleText, setSummaryTitleText]);

  const sections = useHandoutStore((state) => state.sections);
  const vocabBankData = useVocabBankStore((state) => state.vocabBankData);
  const vocabBankConfig = useVocabBankStore((state) => state.config);
  const includeVocabBank = useVocabBankStore((state) => state.includeInCompile);
  const workbookData = useWorkbookStore((state) => state.workbookData);
  const includeInCompile = useWorkbookStore((state) => state.includeInCompile);
  const activeIds = useMemo(
    () =>
      Object.keys(sections)
        .filter((id) => {
          const s = sections[id];
          return s && s.rawText.trim().length > 0;
        })
        .sort(),
    [sections]
  );

  const parsedSections = useMemo<Record<string, HandoutSection>>(
    () =>
      activeIds.reduce<Record<string, HandoutSection>>((acc, id) => {
        const section = sections[id];
        if (section?.isParsed) {
          acc[id] = section;
        }
        return acc;
      }, {}),
    [activeIds, sections]
  );

  const handoutPageCount = useMemo(
    () =>
      Object.values(parsedSections).reduce((count, section) => {
        const sentenceCount = section.sentences.length;
        const page1Count = Math.max(1, Math.ceil(sentenceCount / 7));
        return count + page1Count + 1;
      }, 0),
    [parsedSections]
  );

  const vocabBankPageCount = useMemo(() => {
    if (!vocabBankData || !includeVocabBank) return 0;
    return getVocabBankPageCount(vocabBankData.items.length);
  }, [vocabBankData, includeVocabBank]);

  return (
    <div id="preview-canvas-root" className="h-full overflow-auto bg-[#F9FAFB] px-8 py-6">
      <EditableHintBanner />
      <div className="w-full space-y-12">
        {vocabBankData && includeVocabBank && (
          <VocabBankSheetsForCompile
            vocabBankData={vocabBankData}
            config={vocabBankConfig}
            startOrder={0}
          />
        )}
        {activeIds.map((id, idx) => {
          // Calculate globalPageStart for this section
          const preceding = activeIds.slice(0, idx);
          const precedingPages = preceding.reduce((count, prevId) => {
            const s = parsedSections[prevId];
            if (!s) return count;
            const page1Count = Math.max(1, Math.ceil(s.sentences.length / 7));
            return count + page1Count + 1; // page1 chunks + 1 page2
          }, 0);
          const globalPageStart = vocabBankPageCount + precedingPages + 1;
          return (
            <SectionCanvasItem key={id} id={id} globalPageStart={globalPageStart} />
          );
        })}
        {workbookData && includeInCompile && (
          <WorkbookSheetsForCompile
            workbookData={workbookData}
            parsedSections={parsedSections}
            startOrder={vocabBankPageCount + handoutPageCount}
          />
        )}
      </div>
    </div>
  );
}

const SectionCanvasItem = memo(function SectionCanvasItem({ id, globalPageStart }: { id: string; globalPageStart: number }) {
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

  const sentences = section.sentences || [];
  const chunkSize = 7;
  const sentenceChunks = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    sentenceChunks.push(sentences.slice(i, i + chunkSize));
  }

  if (sentenceChunks.length === 0) {
    sentenceChunks.push([]);
  }

  const sentencePages = sentenceChunks.map((chunk, chunkIdx) => ({
    chunk,
    pageNum: chunkIdx + 1,
  }));

  return (
    <div
      id={`section-${id}`}
      className={`flex flex-col gap-12 transition-all duration-500 ${
        isActive ? "ring-4 ring-[#5E35B1]/20 scale-[1.01]" : "opacity-90"
      }`}
      data-export-id={id}
    >
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
            globalPageNumber={globalPageStart + page.pageNum - 1}
            pageKey={`handout-${id}-p1-${page.pageNum}`}
          />
        </div>
      ))}

      <div
        id={`section-${id}-page2`}
        data-pdf-part="page2"
        className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
      >
        <ParsedHandoutViewPage2
          section={section}
          pageNum={sentenceChunks.length + 1}
          globalPageNumber={globalPageStart + sentenceChunks.length}
          pageKey={`handout-${id}-p2`}
        />
      </div>
    </div>
  );
});
