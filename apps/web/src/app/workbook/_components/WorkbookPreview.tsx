"use client";

import { useMemo, useState } from "react";
import type { HandoutSection } from "@gyoanmaker/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import { useWorkbookExport } from "../_hooks/useWorkbookExport";
import WorkbookAnswerSheet from "./WorkbookAnswerSheet";
import WorkbookStep1Sheet from "./WorkbookStep1Sheet";
import WorkbookStep2Sheet from "./WorkbookStep2Sheet";
import WorkbookStep3Sheet from "./WorkbookStep3Sheet";

interface WorkbookPreviewProps {
  handoutId: string;
  parsedSections: Record<string, HandoutSection>;
  onBackToConfig: () => void;
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export default function WorkbookPreview({
  handoutId,
  parsedSections,
  onBackToConfig,
}: WorkbookPreviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const workbookData = useWorkbookStore((state) => state.workbookData);
  const config = useWorkbookStore((state) => state.config);
  const { exportPDF, isExporting } = useWorkbookExport();

  const passageTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    workbookData?.passages.forEach((passage) => {
      map.set(passage.passageId, passage.passageTitle);
    });
    return map;
  }, [workbookData]);

  const step1Pages = useMemo(() => {
    return Object.entries(parsedSections)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([passageId, section]) => ({
        passageId,
        passageTitle: passageTitleMap.get(passageId) ?? passageId,
        sentences: section.sentences.map((sentence) => sentence.en),
      }))
      .filter((page) => page.sentences.length > 0);
  }, [parsedSections, passageTitleMap]);

  const step2Pages = useMemo(() => {
    if (!workbookData) return [];
    return workbookData.passages.flatMap((passage) =>
      chunkArray(passage.step2Items, 8).map((items, chunkIndex) => ({
        passageId: passage.passageId,
        passageTitle: passage.passageTitle,
        items,
        chunkIndex,
      }))
    );
  }, [workbookData]);

  const step3Pages = useMemo(() => {
    if (!workbookData) return [];
    return workbookData.passages.flatMap((passage) =>
      chunkArray(passage.step3Items, 2).map((items, chunkIndex) => ({
        passageId: passage.passageId,
        passageTitle: passage.passageTitle,
        items,
        chunkIndex,
      }))
    );
  }, [workbookData]);

  const handleExport = async () => {
    if (!workbookData) {
      toast("생성된 워크북이 없습니다.", "error");
      return;
    }

    try {
      const fileName = `${config.testCode || "workbook"}_${new Date()
        .toISOString()
        .slice(0, 10)}`;
      await exportPDF(fileName);
      toast("PDF 저장이 완료되었습니다.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF 저장에 실패했습니다.";
      toast(message, "error");
    }
  };

  const handleSave = async () => {
    if (!workbookData) {
      toast("저장할 워크북 데이터가 없습니다.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/handouts/${handoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbook: workbookData }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(err?.error?.message ?? "워크북 저장에 실패했습니다.");
      }

      // Invalidate compile-init cache so compile page reloads with workbook data
      queryClient.invalidateQueries({ queryKey: ["compile-init", handoutId] });
      toast("워크북 저장이 완료되었습니다.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "워크북 저장에 실패했습니다.";
      toast(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!workbookData) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        생성된 워크북이 없습니다. Step 2에서 워크북을 생성해 주세요.
      </div>
    );
  }

  let orderCursor = 1;
  const step1Start = orderCursor;
  orderCursor += step1Pages.length;
  const step2Start = orderCursor;
  orderCursor += step2Pages.length;
  const step3Start = orderCursor;
  orderCursor += step3Pages.length;
  const answerOrder = orderCursor;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 3</p>
        <h2 className="text-2xl font-bold text-gray-900">워크북 미리보기</h2>
        <p className="text-sm text-gray-500">
          STEP 1 {step1Pages.length}페이지 · STEP 2 {step2Pages.length}페이지 · STEP 3{" "}
          {step3Pages.length}페이지
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-lg bg-[#5E35B1] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isExporting ? "PDF 생성 중..." : "PDF 저장"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "저장 중..." : "히스토리 저장"}
        </button>
        <button
          type="button"
          onClick={onBackToConfig}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-gray-300"
        >
          수정하기
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-4">
        <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-6">
          {step1Pages.map((page, index) => (
            <WorkbookStep1Sheet
              key={`step1-${page.passageId}-${index}`}
              config={config}
              passageId={page.passageId}
              passageTitle={page.passageTitle}
              sentences={page.sentences}
              pageIndex={index}
              pdfOrder={step1Start + index}
            />
          ))}

          {step2Pages.map((page, index) => (
            <WorkbookStep2Sheet
              key={`step2-${page.passageId}-${page.chunkIndex}`}
              config={config}
              passageId={page.passageId}
              passageTitle={page.passageTitle}
              items={page.items}
              pageIndex={index}
              pdfOrder={step2Start + index}
            />
          ))}

          {step3Pages.map((page, index) => (
            <WorkbookStep3Sheet
              key={`step3-${page.passageId}-${page.chunkIndex}`}
              config={config}
              passageId={page.passageId}
              passageTitle={page.passageTitle}
              items={page.items}
              pageIndex={index}
              pdfOrder={step3Start + index}
            />
          ))}

          <WorkbookAnswerSheet
            config={config}
            passages={workbookData.passages}
            pdfOrder={answerOrder}
          />
        </div>
      </div>
    </section>
  );
}
