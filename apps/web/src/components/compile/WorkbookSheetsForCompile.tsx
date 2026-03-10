"use client";

import { useCallback, useMemo } from "react";
import type { HandoutSection, WorkbookData } from "@gyoanmaker/shared/types";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import WorkbookPageShell from "./WorkbookPageShell";
import CompileStep1Content from "./workbook-content/CompileStep1Content";
import CompileStep2Content from "./workbook-content/CompileStep2Content";
import type { FlatStep2Item } from "./workbook-content/CompileStep2Content";
import CompileStep3Content from "./workbook-content/CompileStep3Content";
import type { FlatStep3Item } from "./workbook-content/CompileStep3Content";
import CompileAnswerContent from "./workbook-content/CompileAnswerContent";

interface WorkbookSheetsForCompileProps {
  workbookData: WorkbookData;
  parsedSections: Record<string, HandoutSection>;
  startOrder: number;
}

const PAGE_SHADOW = "0 25px 50px -12px rgba(0,0,0,0.25)";

export default function WorkbookSheetsForCompile({
  workbookData,
  parsedSections,
  startOrder,
}: WorkbookSheetsForCompileProps) {
  const sectionTitle = useWorkbookStore((s) => s.config.testTitle);
  const updateSentenceEn = useHandoutStore((s) => s.updateSentenceEn);
  // Workbook is always section 02 (handout = 01, workbook = 02)
  const sectionNumber = "02";
  // Sort passages consistently by passageId
  const sortedPassages = useMemo(
    () => [...workbookData.passages].sort((a, b) => a.passageId.localeCompare(b.passageId)),
    [workbookData.passages]
  );

  // Step 1: merge ALL sentences from ALL passages into a continuous flat list,
  // then chunk into pages (~15 sentences per page)
  // First page: 7 sentences (banner + instruction take space), rest: 8
  const STEP1_FIRST_PAGE = 7;
  const STEP1_REST_PAGE = 8;

  interface Step1Item {
    text: string;
    sectionId: string;
    sentenceIndex: number;
  }

  const step1AllItems = useMemo(() => {
    const flat: Step1Item[] = [];
    const sorted = Object.entries(parsedSections).sort(([a], [b]) => a.localeCompare(b));
    for (const [sectionId, section] of sorted) {
      for (let i = 0; i < section.sentences.length; i++) {
        flat.push({ text: section.sentences[i].en, sectionId, sentenceIndex: i });
      }
    }
    return flat;
  }, [parsedSections]);

  const step1Pages = useMemo(() => {
    if (step1AllItems.length === 0) return [];
    const pages: Step1Item[][] = [];
    pages.push(step1AllItems.slice(0, STEP1_FIRST_PAGE));
    let cursor = STEP1_FIRST_PAGE;
    while (cursor < step1AllItems.length) {
      pages.push(step1AllItems.slice(cursor, cursor + STEP1_REST_PAGE));
      cursor += STEP1_REST_PAGE;
    }
    return pages;
  }, [step1AllItems]);

  const handleUpdateSentence = useCallback(
    (absoluteIdx: number, newText: string) => {
      const item = step1AllItems[absoluteIdx];
      if (item) updateSentenceEn(item.sectionId, item.sentenceIndex, newText);
    },
    [step1AllItems, updateSentenceEn]
  );

  // Step 2: merge ALL step2Items from ALL passages into a continuous flat list,
  // then chunk into pages (same pattern as STEP 1)
  const STEP2_FIRST_PAGE = 7;
  const STEP2_REST_PAGE = 8;

  const step2AllItems = useMemo(() => {
    const flat: FlatStep2Item[] = [];
    for (const passage of sortedPassages) {
      for (const item of passage.step2Items) {
        flat.push({ ...item, passageId: passage.passageId });
      }
    }
    return flat;
  }, [sortedPassages]);

  const step2Pages = useMemo(() => {
    if (step2AllItems.length === 0) return [];
    const pages: FlatStep2Item[][] = [];
    pages.push(step2AllItems.slice(0, STEP2_FIRST_PAGE));
    let cursor = STEP2_FIRST_PAGE;
    while (cursor < step2AllItems.length) {
      pages.push(step2AllItems.slice(cursor, cursor + STEP2_REST_PAGE));
      cursor += STEP2_REST_PAGE;
    }
    return pages;
  }, [step2AllItems]);

  // Step 3: merge ALL step3Items from ALL passages into a continuous flat list,
  // then chunk 2 items per page (STEP 3 items are large: intro + paragraphs + options)
  // STEP 3 items are large (intro + paragraphs + options), 1 per page to avoid overflow
  const STEP3_FIRST_PAGE = 1;
  const STEP3_REST_PAGE = 1;

  const step3AllItems = useMemo(() => {
    const flat: FlatStep3Item[] = [];
    for (const passage of sortedPassages) {
      for (const item of passage.step3Items) {
        flat.push({ ...item, passageId: passage.passageId });
      }
    }
    return flat;
  }, [sortedPassages]);

  const step3Pages = useMemo(() => {
    if (step3AllItems.length === 0) return [];
    const pages: FlatStep3Item[][] = [];
    pages.push(step3AllItems.slice(0, STEP3_FIRST_PAGE));
    let cursor = STEP3_FIRST_PAGE;
    while (cursor < step3AllItems.length) {
      pages.push(step3AllItems.slice(cursor, cursor + STEP3_REST_PAGE));
      cursor += STEP3_REST_PAGE;
    }
    return pages;
  }, [step3AllItems]);

  // Calculate continuous PDF order numbers
  const { step1Start, step2Start, step3Start, answerOrder } = useMemo(() => {
    let cursor = startOrder + 1;
    const s1 = cursor;
    cursor += step1Pages.length;
    const s2 = cursor;
    cursor += step2Pages.length;
    const s3 = cursor;
    cursor += step3Pages.length;
    return { step1Start: s1, step2Start: s2, step3Start: s3, answerOrder: cursor };
  }, [startOrder, step1Pages.length, step2Pages.length, step3Pages.length]);

  return (
    <div className="flex flex-col gap-6">
      {/* STEP 1 — continuous numbering across all passages */}
      {step1Pages.map((pageItems, index) => {
        const order = step1Start + index;
        const startIndex = index === 0 ? 0 : STEP1_FIRST_PAGE + (index - 1) * STEP1_REST_PAGE;
        return (
          <div
            key={`compile-wb-step1-${index}`}
            data-pdf-part={`workbook-step1-${index}`}
            data-pdf-order={order}
            className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
            style={{ boxShadow: PAGE_SHADOW }}
          >
            <WorkbookPageShell
              sectionNumber={sectionNumber}
              sectionTitle={sectionTitle}
              stepBadge="Workbook"
              stepLabel="STEP 1 스스로 분석"
              globalPageNumber={order}
              showBanner={index === 0}
            >
              <CompileStep1Content
                sentences={pageItems.map((item) => item.text)}
                startIndex={startIndex}
                onUpdateSentence={(localIdx, newText) =>
                  handleUpdateSentence(startIndex + localIdx, newText)
                }
              />
            </WorkbookPageShell>
          </div>
        );
      })}

      {/* STEP 2 — continuous numbering across all passages */}
      {step2Pages.map((pageItems, index) => {
        const order = step2Start + index;
        const startIndex = index === 0 ? 0 : STEP2_FIRST_PAGE + (index - 1) * STEP2_REST_PAGE;
        return (
          <div
            key={`compile-wb-step2-${index}`}
            data-pdf-part={`workbook-step2-${index}`}
            data-pdf-order={order}
            className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
            style={{ boxShadow: PAGE_SHADOW }}
          >
            <WorkbookPageShell
              sectionNumber={sectionNumber}
              sectionTitle={sectionTitle}
              stepBadge="Workbook"
              stepLabel="STEP 2 어법/어휘 선택"
              globalPageNumber={order}
              showBanner={index === 0}
            >
              <CompileStep2Content
                items={pageItems}
                startIndex={startIndex}
              />
            </WorkbookPageShell>
          </div>
        );
      })}

      {/* STEP 3 — continuous numbering across all passages */}
      {step3Pages.map((pageItems, index) => {
        const order = step3Start + index;
        const startIndex = index === 0 ? 0 : STEP3_FIRST_PAGE + (index - 1) * STEP3_REST_PAGE;
        return (
          <div
            key={`compile-wb-step3-${index}`}
            data-pdf-part={`workbook-step3-${index}`}
            data-pdf-order={order}
            className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
            style={{ boxShadow: PAGE_SHADOW }}
          >
            <WorkbookPageShell
              sectionNumber={sectionNumber}
              sectionTitle={sectionTitle}
              stepBadge="Workbook"
              stepLabel="STEP 3 순서 배열"
              globalPageNumber={order}
              showBanner={index === 0}
            >
              <CompileStep3Content
                items={pageItems}
                startIndex={startIndex}
              />
            </WorkbookPageShell>
          </div>
        );
      })}

      {/* Answer sheet */}
      <div
        data-pdf-part="workbook-answer"
        data-pdf-order={answerOrder}
        className="bg-white rounded-[2px] overflow-hidden min-h-[1123px] flex flex-col relative"
        style={{ boxShadow: PAGE_SHADOW }}
      >
        <WorkbookPageShell
          sectionNumber={sectionNumber}
          sectionTitle={sectionTitle}
          stepBadge="정답지"
          stepLabel=""
          globalPageNumber={answerOrder}
        >
          <CompileAnswerContent passages={sortedPassages} />
        </WorkbookPageShell>
      </div>
    </div>
  );
}
