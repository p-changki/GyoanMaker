"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import CompileLayout from "@/components/compile/CompileLayout";
import { generatePassages, type ApiResultItem } from "@/services/api";
import { CompiledHandout, HandoutSection } from "@/types/handout";
import { parseHandoutSection } from "@/lib/parseHandout";
import { normalizeHandoutRawText } from "@/lib/normalizeHandoutRawText";
import {
  getCachedResult,
  hashPassages,
  setCachedResult,
} from "@/services/cache";
import { useHandoutStore } from "@/stores/useHandoutStore";

const INPUT_STORAGE_KEY = "gyoanmaker:input";
const INPUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const COMPILED_PREFIX = "gyoanmaker:compiled:";

function stripTopicSummaryLanguageLabels(text: string): string {
  return normalizeHandoutRawText(text);
}

interface CompileInputData {
  passages: string[];
  hash: string;
}

function createInitialSections(
  results: ApiResultItem[]
): Record<string, HandoutSection> {
  const sections: Record<string, HandoutSection> = {};

  for (const item of results) {
    const id = `P${String(item.index + 1).padStart(2, "0")}`;

    sections[id] = {
      passageId: id,
      sentences: [],
      topic: { en: "", ko: "" },
      summary: { en: "", ko: "" },
      flow: [],
      vocabulary: [],
      rawText: item.outputText || "",
      isParsed: false,
    };
  }

  return sections;
}

export default function CompilePage() {
  const router = useRouter();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState({
    current: 0,
    total: 0,
  });

  const setCompiledData = useHandoutStore((state) => state.setCompiledData);
  const setApplying = useHandoutStore((state) => state.setApplying);
  const setProgress = useHandoutStore((state) => state.setProgress);
  const updateSection = useHandoutStore((state) => state.updateSection);

  const inputQuery = useQuery<CompileInputData | null>({
    queryKey: ["compile", "input"],
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const stored = sessionStorage.getItem(INPUT_STORAGE_KEY);
      if (!stored) {
        return null;
      }

      try {
        const parsed = JSON.parse(stored) as {
          passages?: unknown;
          timestamp?: unknown;
        };
        if (!Array.isArray(parsed.passages)) {
          return null;
        }

        const payloadAge =
          typeof parsed.timestamp === "string"
            ? Date.now() - new Date(parsed.timestamp).getTime()
            : Number.NaN;
        if (!Number.isFinite(payloadAge) || payloadAge > INPUT_MAX_AGE_MS) {
          sessionStorage.removeItem(INPUT_STORAGE_KEY);
          return null;
        }

        const passages = parsed.passages.filter(
          (item): item is string => typeof item === "string"
        );

        if (passages.length === 0) {
          return null;
        }

        const hash = await hashPassages(passages);
        return { passages, hash };
      } catch (error) {
        console.error("Failed to parse compile input", error);
        return null;
      }
    },
  });

  const compileQuery = useQuery<{ hash: string }>({
    queryKey: ["compile", "bootstrap", inputQuery.data?.hash],
    enabled: Boolean(inputQuery.data?.hash),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const input = inputQuery.data;
      if (!input) {
        throw new Error("입력 데이터를 찾을 수 없습니다.");
      }

      const compiledKey = `${COMPILED_PREFIX}${input.hash}`;
      const cachedCompiled = sessionStorage.getItem(compiledKey);

      if (cachedCompiled) {
        const parsed = JSON.parse(cachedCompiled) as CompiledHandout;
        setCompiledData(parsed.sections);
        return { hash: input.hash };
      }

      let cachedResult = getCachedResult(input.hash);

      if (!cachedResult) {
        const response = await generatePassages(input.passages);
        setCachedResult(input.hash, response.results);
        cachedResult = {
          version: 2,
          results: response.results,
          createdAt: new Date().toISOString(),
        };
      }

      const sections = createInitialSections(cachedResult.results);
      setCompiledData(sections);

      return { hash: input.hash };
    },
  });

  const isLoading =
    inputQuery.isLoading ||
    (inputQuery.data !== null &&
      inputQuery.data !== undefined &&
      compileQuery.isLoading);

  // 2. 템플릿 적용 (파싱 실행)
  const handleApplyTemplate = useCallback(async () => {
    setApplying(true);
    setProgress(0);

    try {
      const sectionIds = Object.keys(
        useHandoutStore.getState().sections
      ).sort();

      for (let i = 0; i < sectionIds.length; i += 1) {
        const id = sectionIds[i];
        const section = useHandoutStore.getState().sections[id];

        if (section && !section.isParsed && section.rawText) {
          updateSection(id, parseHandoutSection(id, section.rawText));
        }

        setProgress(i + 1);
        await new Promise((resolve) => setTimeout(resolve, i < 5 ? 100 : 30));
      }

      const hash = compileQuery.data?.hash;
      if (!hash) {
        return;
      }

      const compiledData: CompiledHandout = {
        sections: useHandoutStore.getState().sections,
        lastUpdated: new Date().toISOString(),
      };

      sessionStorage.setItem(
        `${COMPILED_PREFIX}${hash}`,
        JSON.stringify(compiledData)
      );
    } catch (error) {
      console.error("Failed to apply compile template", error);
    } finally {
      setApplying(false);
    }
  }, [compileQuery.data?.hash, setApplying, setProgress, updateSection]);

  // 4. 전체 복사
  const handleCopyAll = useCallback(() => {
    const sections = useHandoutStore.getState().sections;
    const allText = Object.keys(sections)
      .sort()
      .map((id) => {
        const s = sections[id];
        if (!s.isParsed)
          return `【${id}】\n${stripTopicSummaryLanguageLabels(s.rawText)}`;

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

  // 5. TXT 다운로드
  const handleDownloadTxt = useCallback(() => {
    const sections = useHandoutStore.getState().sections;
    const allText = Object.keys(sections)
      .sort()
      .map((id) => {
        const s = sections[id];
        return `【${id}】\n${s.isParsed ? "" : "(미파싱 원문)\n"}${stripTopicSummaryLanguageLabels(s.rawText)}`;
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

  const handleExportPDF = useCallback(async (customFileName?: string) => {
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
      let pdf: typeof jsPDF.prototype | null = null; // Initialize pdf outside the loop

      const a4WidthMm = 210; // A4 width in mm

      for (const id of exportIds) {
        // 해당 id의 전체 컨테이너(SectionCanvasItem) 탐색
        const sectionContainer = document.querySelector(
          `[data-export-id="${id}"]`
        );
        if (!sectionContainer) continue;

        // 컨테이너 내부의 모든 쪼개진 PDF 페이지용 요소들 (page1-0, page1-1, ..., page2) 탐색
        const partElements = Array.from(
          sectionContainer.querySelectorAll<HTMLElement>("[data-pdf-part]")
        );

        for (let j = 0; j < partElements.length; j += 1) {
          const element = partElements[j];

          // 캡처 전 A4 사이즈 강제 고정 (수축 완전 차단)
          const styles = element.style;
          const oWidth = styles.width;
          const oMinWidth = styles.minWidth;
          const oMaxWidth = styles.maxWidth;
          const oFlexShrink = styles.flexShrink;

          styles.width = "794px";
          styles.minWidth = "794px";
          styles.maxWidth = "794px";
          styles.flexShrink = "0";

          // Capture the element
          const canvas = await html2canvas(element, {
            scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            windowWidth: 794,
            windowHeight: element.scrollHeight,
          });

          const imageData = canvas.toDataURL("image/png");

          // Restore styles after capture
          styles.width = oWidth;
          styles.minWidth = oMinWidth;
          styles.maxWidth = oMaxWidth;
          styles.flexShrink = oFlexShrink;

          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;

          // Option A: Fill A4 width (210mm) 100%
          const imageWidth = a4WidthMm;
          // Height scales proportionally to canvas aspect ratio
          const imageHeight = (canvasHeight * a4WidthMm) / canvasWidth;

          if (!pdf) {
            // First page: Start PDF document with custom paper size matching content length
            pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: [imageWidth, Math.max(297, imageHeight)], // Ensure minimum A4 height
            });
          } else {
            // Add a new page for subsequent images
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

          canvas.width = 0;
          canvas.height = 0;

          await new Promise((resolve) => setTimeout(resolve, 100));
        } // end of inner loop for pages

        setExportProgress({
          current: exportIds.indexOf(id) + 1,
          total: exportIds.length,
        });
      } // end of outer loop for exportIds

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
  }, []);

  const errorMessage = useMemo(() => {
    if (inputQuery.error) {
      return inputQuery.error.message;
    }
    if (compileQuery.error) {
      return compileQuery.error.message;
    }
    return null;
  }, [compileQuery.error, inputQuery.error]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#5E35B1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black text-[#5E35B1] animate-pulse uppercase tracking-widest">
            Loading Layout...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-sm font-black text-red-600 uppercase tracking-widest">
            Compile Error
          </p>
          <p className="text-sm text-gray-600 font-medium">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/generate")}
            className="px-6 py-2 bg-[#5E35B1] text-white rounded-xl font-bold text-sm"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  if (!inputQuery.data) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">
            입력 데이터가 없습니다
          </p>
          <button
            type="button"
            onClick={() => router.push("/generate")}
            className="px-6 py-2 bg-[#5E35B1] text-white rounded-xl font-bold text-sm"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <CompileLayout
      onApplyTemplate={handleApplyTemplate}
      onCopyAll={handleCopyAll}
      onDownloadTxt={handleDownloadTxt}
      onExportPdf={handleExportPDF}
      isExportingPdf={isExportingPdf}
      exportCurrent={exportProgress.current}
      exportTotal={exportProgress.total}
    />
  );
}
