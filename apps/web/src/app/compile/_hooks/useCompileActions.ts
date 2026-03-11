"use client";

import { Dispatch, SetStateAction, useCallback, useRef } from "react";
import { parseHandoutSection } from "@/lib/parseHandout";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useVocabBankStore } from "@/stores/useVocabBankStore";
import { useToast } from "@/components/ui/Toast";
import {
  COMPILED_PREFIX,
  normalizeRawExportText,
} from "./compileData.constants";
import type { ExportSelection } from "@/components/compile/ExportSelectModal";

/**
 * Wait for all document fonts to be fully loaded and rendered.
 * Uses document.fonts.load() to explicitly trigger loading of commonly used fonts,
 * then waits for document.fonts.ready to ensure all fonts are available.
 */
async function waitForFontsReady(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  // Explicitly trigger font loading for known families used in handouts
  const fontChecks = [
    'normal 400 16px "GmarketSans"',
    'normal 700 16px "GmarketSans"',
    'normal 500 16px "KoPub Dotum"',
    'normal 400 16px "Pretendard Variable"',
    'normal 700 16px "Pretendard Variable"',
  ];

  // Trigger loads (some may fail if font isn't declared — that's fine)
  await Promise.allSettled(fontChecks.map((spec) => document.fonts.load(spec)));

  // Wait for all in-flight font loads to finish
  await document.fonts.ready;

  // Extra frame to let the browser finish painting with real fonts
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

const A4_WIDTH_PX = 794;
const A4_MIN_HEIGHT_MM = 297;
const A4_WIDTH_MM = 210;

/**
 * Capture a single DOM element to a PDF page using html2canvas.
 * Handles style override, image loading, canvas capture, and memory cleanup.
 */
async function captureElementToPdf(
  element: HTMLElement,
  pdf: InstanceType<typeof import("jspdf").jsPDF> | null,
  html2canvas: typeof import("html2canvas-pro").default,
  scale: number
): Promise<InstanceType<typeof import("jspdf").jsPDF>> {
  const { jsPDF } = await import("jspdf");

  const styles = element.style;
  const saved = {
    width: styles.width,
    minWidth: styles.minWidth,
    maxWidth: styles.maxWidth,
    flexShrink: styles.flexShrink,
    boxShadow: styles.boxShadow,
  };

  styles.width = `${A4_WIDTH_PX}px`;
  styles.minWidth = `${A4_WIDTH_PX}px`;
  styles.maxWidth = `${A4_WIDTH_PX}px`;
  styles.flexShrink = "0";
  styles.boxShadow = "none";

  const naturalHeight = element.scrollHeight;
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Wait for all images to finish loading
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          })
    )
  );

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    windowWidth: A4_WIDTH_PX,
    windowHeight: naturalHeight,
    onclone: async (clonedDoc) => {
      if (clonedDoc.fonts?.ready) {
        await clonedDoc.fonts.ready;
      }
      // html2canvas renders each character individually when letter-spacing != 0,
      // causing floating-point y-offset errors (wavy text). Reset to 0 for stable rendering.
      clonedDoc.querySelectorAll<HTMLElement>("*").forEach((el) => {
        el.style.letterSpacing = "0px";
      });
      clonedDoc.querySelectorAll<HTMLElement>("[data-summary-bar]").forEach((bar) => {
        bar.style.overflow = "visible";
        bar.style.borderRadius = "12px";
      });
    },
    ignoreElements: (el) => {
      const tag = el.tagName?.toLowerCase();
      if (tag === "script" || tag === "link") {
        const src = el.getAttribute("src") || el.getAttribute("href") || "";
        if (src.includes("query-devtools") || src.includes("react-devtools")) return true;
      }
      return false;
    },
  });

  const imageData = canvas.toDataURL("image/png");

  // Restore original styles
  styles.width = saved.width;
  styles.minWidth = saved.minWidth;
  styles.maxWidth = saved.maxWidth;
  styles.flexShrink = saved.flexShrink;
  styles.boxShadow = saved.boxShadow;

  const imageWidth = A4_WIDTH_MM;
  const imageHeight = (canvas.height * A4_WIDTH_MM) / canvas.width;

  let pdfInstance = pdf;
  if (!pdfInstance) {
    pdfInstance = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [imageWidth, Math.max(A4_MIN_HEIGHT_MM, imageHeight)],
    });
  } else {
    pdfInstance.addPage([imageWidth, Math.max(A4_MIN_HEIGHT_MM, imageHeight)]);
  }

  pdfInstance.addImage(imageData, "PNG", 0, 0, imageWidth, imageHeight, undefined, "FAST");

  // Free canvas memory
  const ctx = canvas.getContext("2d");
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = 1;
  canvas.height = 1;

  await new Promise((resolve) => setTimeout(resolve, 100));

  return pdfInstance;
}

interface UseCompileActionsParams {
  hash: string | undefined;
  setApplying: (isApplying: boolean) => void;
  setProgress: (current: number) => void;
  updateSection: (id: string, section: HandoutSection) => void;
  setIsExportingPdf: Dispatch<SetStateAction<boolean>>;
  setExportProgress: Dispatch<SetStateAction<{ current: number; total: number }>>;
}

export function useCompileActions({
  hash,
  setApplying,
  setProgress,
  updateSection,
  setIsExportingPdf,
  setExportProgress,
}: UseCompileActionsParams) {
  const { toast } = useToast();
  const isApplyingRef = useRef(false);

  const handleApplyTemplate = useCallback(async () => {
    if (isApplyingRef.current) return;
    isApplyingRef.current = true;
    setApplying(true);
    setProgress(0);

    try {
      const sectionIds = Object.keys(useHandoutStore.getState().sections).sort();

      for (let i = 0; i < sectionIds.length; i += 1) {
        const id = sectionIds[i];
        const section = useHandoutStore.getState().sections[id];

        if (section && !section.isParsed && section.rawText) {
          updateSection(id, parseHandoutSection(id, section.rawText));
        }

        setProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, i < 5 ? 100 : 30));
      }

      if (!hash) {
        return;
      }

      const compiledData: CompiledHandout = {
        sections: useHandoutStore.getState().sections,
        illustrations: useHandoutStore.getState().illustrations,
        lastUpdated: new Date().toISOString(),
      };

      sessionStorage.setItem(`${COMPILED_PREFIX}${hash}`, JSON.stringify(compiledData));
    } catch (error) {
      console.error("Failed to apply compile template", error);
    } finally {
      isApplyingRef.current = false;
      setApplying(false);
    }
  }, [hash, setApplying, setProgress, updateSection]);

  const buildExportText = useCallback(
    (selection: ExportSelection, mode: "full" | "raw") => {
      const SEP = "\n\n" + "=".repeat(30) + "\n\n";
      const parts: string[] = [];

      // ── 교안 ─────────────────────────────────────────────
      if (selection.handout) {
        const sections = useHandoutStore.getState().sections;
        const handoutText = Object.keys(sections)
          .sort()
          .map((id) => {
            const s = sections[id];
            if (mode === "raw" || !s.isParsed) {
              return `【${id}】\n${s.isParsed ? "" : "(Unparsed raw text)\n"}${normalizeRawExportText(s.rawText)}`;
            }

            let text = `【${id}】\n\n`;
            text += `[Sentence Analysis & Translation]\nEnglish Section\n`;
            text += `${s.sentences.map((p) => p.en).join("\n")}\n`;
            text += `Korean Section\n${s.sentences.map((p) => p.ko).join("\n")}\n\n`;
            text += `[Topic Sentence]\n${s.topic.en}\n${s.topic.ko}\n\n`;
            text += `[Summary]\n${s.summary.en}\n${s.summary.ko}\n\n`;
            text += `[4-Step Flow]\n${s.flow.map((step) => step.text).join("\n")}\n\n`;
            text += `[Core Vocabulary & Expansion]\n`;
            text += s.vocabulary
              .map((vocab, index) => {
                const synonyms = vocab.synonyms
                  .map((entry) => `${entry.word} ${entry.meaning}`.trim())
                  .join("\n");
                const antonyms = vocab.antonyms
                  .map((entry) => `${entry.word} ${entry.meaning}`.trim())
                  .join("\n");
                return `${index + 1}. ${vocab.word} ${vocab.meaning}\nSynonyms\n${synonyms}\nAntonyms\n${antonyms}`;
              })
              .join("\n\n");
            return text;
          })
          .join(SEP);

        if (handoutText) parts.push(`▶ 교안\n\n${handoutText}`);
      }

      // ── 보카뱅크 ─────────────────────────────────────────
      if (selection.vocabBank) {
        const { vocabBankData } = useVocabBankStore.getState();
        if (vocabBankData) {
          const lines = vocabBankData.items
            .map(
              (item, i) =>
                `${i + 1}. ${item.word} [${item.partOfSpeech}]  ${item.meaningKo}  (${item.sourcePassageIds.join(", ")})`
            )
            .join("\n");
          parts.push(`▶ 보카뱅크\n\n${lines}`);
        }
      }

      // ── 워크북 ───────────────────────────────────────────
      if (selection.workbook) {
        const { workbookData } = useWorkbookStore.getState();
        if (workbookData) {
          const wbParts = workbookData.passages.map((passage) => {
            let t = `[${passage.passageTitle}]\n\n`;

            if (passage.step2Items.length > 0) {
              t += "STEP 2 — 어법/어휘\n";
              t += passage.step2Items
                .map(
                  (item) =>
                    `Q${item.questionNumber}. ${item.sentenceTemplate}\n    정답: ${item.answerKey.join(", ")}`
                )
                .join("\n");
              t += "\n\n";
            }

            if (passage.step3Items.length > 0) {
              t += "STEP 3 — 단락 순서\n";
              t += passage.step3Items
                .map((item) => {
                  const correctOrder = item.options[item.answerIndex];
                  const paragraphs = item.paragraphs
                    .map((p) => `(${p.label}) ${p.text}`)
                    .join("\n");
                  return `Q${item.questionNumber}. ${item.intro}\n${paragraphs}\n    정답: (${correctOrder?.join(")-(") ?? ""})`;
                })
                .join("\n\n");
            }

            return t;
          });
          parts.push(`▶ 워크북\n\n${wbParts.join(SEP)}`);
        }
      }

      return parts.join("\n\n" + "█".repeat(40) + "\n\n");
    },
    []
  );

  const handleCopyAll = useCallback(
    (selection: ExportSelection) => {
      const text = buildExportText(selection, "full");
      navigator.clipboard.writeText(text);
      toast("선택한 내용이 클립보드에 복사되었습니다.", "success");
    },
    [buildExportText, toast]
  );

  const handleDownloadTxt = useCallback(
    (selection: ExportSelection) => {
      const text = buildExportText(selection, "raw");
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Gyoan_Compiled_${new Date().toISOString().slice(0, 10)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [buildExportText]
  );

  const handleExportPDF = useCallback(
    async (customFileName?: string) => {
      const sections = useHandoutStore.getState().sections;
      const exportIds = Object.keys(sections)
        .sort()
        .filter((id) => {
          const section = sections[id];
          return Boolean(section?.isParsed && section.rawText?.trim());
        });

      if (exportIds.length === 0) {
        toast("No parsed passages available for PDF export.", "error");
        return;
      }

      setIsExportingPdf(true);

      const vocabBankStateForCount = useVocabBankStore.getState();
      const vocabBankPageCount =
        vocabBankStateForCount.includeInCompile && vocabBankStateForCount.vocabBankData
          ? document.querySelectorAll('[data-pdf-part^="vocab-bank-"]').length
          : 0;

      // Count workbook pages for accurate progress total
      const workbookStateForCount = useWorkbookStore.getState();
      const workbookPageCount =
        workbookStateForCount.includeInCompile && workbookStateForCount.workbookData
          ? document.querySelectorAll('[data-pdf-part^="workbook-"]').length
          : 0;
      const totalPages = exportIds.length + workbookPageCount + vocabBankPageCount;
      setExportProgress({ current: 0, total: totalPages });

      try {
        // Ensure all fonts are fully loaded before capture
        await waitForFontsReady();

        const [{ default: html2canvas }] = await Promise.all([
          import("html2canvas-pro"),
        ]);

        const scale = 2; // Fixed scale for consistent PDF output across devices
        let capturedCount = 0;
        let pdf: InstanceType<typeof import("jspdf").jsPDF> | null = null;

        // Helper to get sorted elements by data-pdf-order
        const getSortedPdfParts = (selector: string) =>
          Array.from(document.querySelectorAll<HTMLElement>(selector)).sort((a, b) => {
            const aOrder = Number.parseInt(a.dataset.pdfOrder ?? "0", 10);
            const bOrder = Number.parseInt(b.dataset.pdfOrder ?? "0", 10);
            return aOrder - bOrder;
          });

        // 1. Vocab Bank pages
        const vocabBankState = useVocabBankStore.getState();
        if (vocabBankState.includeInCompile && vocabBankState.vocabBankData) {
          for (const element of getSortedPdfParts('[data-pdf-part^="vocab-bank-"]')) {
            pdf = await captureElementToPdf(element, pdf, html2canvas, scale);
            capturedCount += 1;
            setExportProgress({ current: capturedCount, total: totalPages });
          }
        }

        // 2. Handout pages
        for (const id of exportIds) {
          const sectionContainer = document.querySelector(`[data-export-id="${id}"]`);
          if (!sectionContainer) continue;

          const partElements = Array.from(
            sectionContainer.querySelectorAll<HTMLElement>("[data-pdf-part]")
          );

          for (const element of partElements) {
            pdf = await captureElementToPdf(element, pdf, html2canvas, scale);
            capturedCount += 1;
          }

          setExportProgress({ current: capturedCount, total: totalPages });
        }

        // 3. Workbook pages
        const workbookState = useWorkbookStore.getState();
        if (workbookState.includeInCompile && workbookState.workbookData) {
          for (const element of getSortedPdfParts('[data-pdf-part^="workbook-"]')) {
            pdf = await captureElementToPdf(element, pdf, html2canvas, scale);
            capturedCount += 1;
            setExportProgress({ current: capturedCount, total: totalPages });
          }
        }

        if (capturedCount === 0 || !pdf) {
          toast("No sections found for PDF export.", "error");
          return;
        }

        const finalFileName = customFileName?.trim()
          ? customFileName.trim().toLowerCase().endsWith(".pdf")
            ? customFileName.trim()
            : `${customFileName.trim()}.pdf`
          : "GyoanMaker_Export.pdf";

        pdf.save(finalFileName);
      } catch (error) {
        console.error("Failed to export PDF", error);
        toast("Error generating PDF. Please try again.", "error");
      } finally {
        setIsExportingPdf(false);
        setExportProgress({ current: 0, total: 0 });
      }
    },
    [setExportProgress, setIsExportingPdf, toast]
  );

  return {
    handleApplyTemplate,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
  };
}
