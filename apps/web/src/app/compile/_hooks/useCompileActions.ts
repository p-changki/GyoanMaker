"use client";

import { Dispatch, SetStateAction, useCallback, useRef } from "react";
import { parseHandoutSection } from "@/lib/parseHandout";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useToast } from "@/components/ui/Toast";
import {
  COMPILED_PREFIX,
  normalizeRawExportText,
} from "./compileData.constants";

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

  const handleCopyAll = useCallback(() => {
    const sections = useHandoutStore.getState().sections;
    const allText = Object.keys(sections)
      .sort()
      .map((id) => {
        const s = sections[id];
        if (!s.isParsed) {
          return `【${id}】\n${normalizeRawExportText(s.rawText)}`;
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
      .join("\n\n" + "=".repeat(30) + "\n\n");

    navigator.clipboard.writeText(allText);
    toast("Full handout content copied to clipboard.", "success");
  }, [toast]);

  const handleDownloadTxt = useCallback(() => {
    const sections = useHandoutStore.getState().sections;
    const allText = Object.keys(sections)
      .sort()
      .map((id) => {
        const s = sections[id];
        return `【${id}】\n${s.isParsed ? "" : "(Unparsed raw text)\n"}${normalizeRawExportText(s.rawText)}`;
      })
      .join("\n\n" + "=".repeat(30) + "\n\n");

    const blob = new Blob([allText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Gyoan_Compiled_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

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

      // Count workbook pages for accurate progress total
      const workbookStateForCount = useWorkbookStore.getState();
      const workbookPageCount =
        workbookStateForCount.includeInCompile && workbookStateForCount.workbookData
          ? document.querySelectorAll('[data-pdf-part^="workbook-"]').length
          : 0;
      const totalPages = exportIds.length + workbookPageCount;
      setExportProgress({ current: 0, total: totalPages });

      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);

        const scale = Math.max(2, window.devicePixelRatio || 1);
        let capturedCount = 0;
        let pdf: typeof jsPDF.prototype | null = null;
        const a4WidthMm = 210;

        for (const id of exportIds) {
          const sectionContainer = document.querySelector(`[data-export-id="${id}"]`);
          if (!sectionContainer) continue;

          const partElements = Array.from(
            sectionContainer.querySelectorAll<HTMLElement>("[data-pdf-part]")
          );

          for (let j = 0; j < partElements.length; j += 1) {
            const element = partElements[j];
            const styles = element.style;
            const oWidth = styles.width;
            const oMinWidth = styles.minWidth;
            const oMaxWidth = styles.maxWidth;
            const oFlexShrink = styles.flexShrink;

            styles.width = "794px";
            styles.minWidth = "794px";
            styles.maxWidth = "794px";
            styles.flexShrink = "0";

            // Auto-fit: scale down content that exceeds A4 height (1123px)
            const a4HeightPx = 1123;
            const naturalHeight = element.scrollHeight;
            const oTransform = styles.transform;
            const oTransformOrigin = styles.transformOrigin;
            const oHeight = styles.height;
            let fitScale = 1;
            if (naturalHeight > a4HeightPx) {
              fitScale = a4HeightPx / naturalHeight;
              styles.transform = `scale(${fitScale})`;
              styles.transformOrigin = "top left";
              styles.height = `${a4HeightPx}px`;
            }

            const canvas = await html2canvas(element, {
              scale,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              windowWidth: 794,
              windowHeight: fitScale < 1 ? a4HeightPx : naturalHeight,
              ignoreElements: (el) => {
                // Exclude devtools elements that cause 404 errors in iframe cloning
                const tag = el.tagName?.toLowerCase();
                if (tag === "script" || tag === "link") {
                  const src = el.getAttribute("src") || el.getAttribute("href") || "";
                  if (src.includes("query-devtools") || src.includes("react-devtools")) return true;
                }
                return false;
              },
            });

            const imageData = canvas.toDataURL("image/png");
            styles.width = oWidth;
            styles.minWidth = oMinWidth;
            styles.maxWidth = oMaxWidth;
            styles.flexShrink = oFlexShrink;
            styles.transform = oTransform;
            styles.transformOrigin = oTransformOrigin;
            styles.height = oHeight;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const imageWidth = a4WidthMm;
            const imageHeight = (canvasHeight * a4WidthMm) / canvasWidth;

            if (!pdf) {
              pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [imageWidth, Math.max(297, imageHeight)],
              });
            } else {
              pdf.addPage([imageWidth, Math.max(297, imageHeight)]);
            }

            pdf.addImage(
              imageData,
              "PNG",
              0,
              0,
              imageWidth,
              imageHeight,
              undefined,
              "FAST"
            );

            capturedCount += 1;

            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 1;
            canvas.height = 1;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          setExportProgress({
            current: exportIds.indexOf(id) + 1,
            total: totalPages,
          });
        }

        const workbookState = useWorkbookStore.getState();
        if (workbookState.includeInCompile && workbookState.workbookData) {
          const workbookParts = Array.from(
            document.querySelectorAll<HTMLElement>('[data-pdf-part^="workbook-"]')
          ).sort((a, b) => {
            const aOrder = Number.parseInt(a.dataset.pdfOrder ?? "0", 10);
            const bOrder = Number.parseInt(b.dataset.pdfOrder ?? "0", 10);
            return aOrder - bOrder;
          });

          for (const element of workbookParts) {
            const styles = element.style;
            const oWidth = styles.width;
            const oMinWidth = styles.minWidth;
            const oMaxWidth = styles.maxWidth;
            const oFlexShrink = styles.flexShrink;

            styles.width = "794px";
            styles.minWidth = "794px";
            styles.maxWidth = "794px";
            styles.flexShrink = "0";

            // Auto-fit: scale down content that exceeds A4 height (1123px)
            const a4HeightPxWb = 1123;
            const naturalHeight = element.scrollHeight;
            const oTransformWb = styles.transform;
            const oTransformOriginWb = styles.transformOrigin;
            const oHeightWb = styles.height;
            let fitScaleWb = 1;
            if (naturalHeight > a4HeightPxWb) {
              fitScaleWb = a4HeightPxWb / naturalHeight;
              styles.transform = `scale(${fitScaleWb})`;
              styles.transformOrigin = "top left";
              styles.height = `${a4HeightPxWb}px`;
            }

            const canvas = await html2canvas(element, {
              scale,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              windowWidth: 794,
              windowHeight: fitScaleWb < 1 ? a4HeightPxWb : naturalHeight,
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
            styles.width = oWidth;
            styles.minWidth = oMinWidth;
            styles.maxWidth = oMaxWidth;
            styles.flexShrink = oFlexShrink;
            styles.transform = oTransformWb;
            styles.transformOrigin = oTransformOriginWb;
            styles.height = oHeightWb;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const imageWidth = a4WidthMm;
            const imageHeight = (canvasHeight * a4WidthMm) / canvasWidth;

            if (!pdf) {
              pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: [imageWidth, Math.max(297, imageHeight)],
              });
            } else {
              pdf.addPage([imageWidth, Math.max(297, imageHeight)]);
            }

            pdf.addImage(
              imageData,
              "PNG",
              0,
              0,
              imageWidth,
              imageHeight,
              undefined,
              "FAST"
            );

            capturedCount += 1;
            setExportProgress({ current: capturedCount, total: totalPages });

            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 1;
            canvas.height = 1;
            await new Promise((resolve) => setTimeout(resolve, 100));
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
