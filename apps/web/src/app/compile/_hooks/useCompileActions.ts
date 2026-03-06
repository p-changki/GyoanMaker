"use client";

import { Dispatch, SetStateAction, useCallback, useRef } from "react";
import { parseHandoutSection } from "@/lib/parseHandout";
import { type CompiledHandout, type HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useHandoutStore } from "@/stores/useHandoutStore";
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
        text += `[문장별 구문 분석 및 해석]\n영어 섹션\n`;
        text += `${s.sentences.map((p) => p.en).join("\n")}\n`;
        text += `한글 섹션\n${s.sentences.map((p) => p.ko).join("\n")}\n\n`;
        text += `[주제문]\n${s.topic.en}\n${s.topic.ko}\n\n`;
        text += `[본문 요약]\n${s.summary.en}\n${s.summary.ko}\n\n`;
        text += `[글의 흐름 4단 정리]\n${s.flow.map((step) => step.text).join("\n")}\n\n`;
        text += `[핵심 어휘 및 확장]\n`;
        text += s.vocabulary
          .map((vocab, index) => {
            const synonyms = vocab.synonyms
              .map((entry) => `${entry.word} ${entry.meaning}`.trim())
              .join("\n");
            const antonyms = vocab.antonyms
              .map((entry) => `${entry.word} ${entry.meaning}`.trim())
              .join("\n");

            return `${index + 1}. ${vocab.word} ${vocab.meaning}\n유의어\n${synonyms}\n반의어\n${antonyms}`;
          })
          .join("\n\n");

        return text;
      })
      .join("\n\n" + "=".repeat(30) + "\n\n");

    navigator.clipboard.writeText(allText);
    alert("전체 교안 내용이 클립보드에 복사되었습니다.");
  }, []);

  const handleDownloadTxt = useCallback(() => {
    const sections = useHandoutStore.getState().sections;
    const allText = Object.keys(sections)
      .sort()
      .map((id) => {
        const s = sections[id];
        return `【${id}】\n${s.isParsed ? "" : "(미파싱 원문)\n"}${normalizeRawExportText(s.rawText)}`;
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
        alert("PDF로 추출할 파싱 완료 지문이 없습니다.");
        return;
      }

      setIsExportingPdf(true);
      setExportProgress({ current: 0, total: exportIds.length });

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

            const canvas = await html2canvas(element, {
              scale,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              windowWidth: 794,
              windowHeight: element.scrollHeight,
            });

            const imageData = canvas.toDataURL("image/png");
            styles.width = oWidth;
            styles.minWidth = oMinWidth;
            styles.maxWidth = oMaxWidth;
            styles.flexShrink = oFlexShrink;

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
            total: exportIds.length,
          });
        }

        if (capturedCount === 0 || !pdf) {
          alert("PDF로 추출할 섹션을 찾지 못했습니다.");
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
        alert("PDF 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setIsExportingPdf(false);
        setExportProgress({ current: 0, total: 0 });
      }
    },
    [setExportProgress, setIsExportingPdf]
  );

  return {
    handleApplyTemplate,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
  };
}
