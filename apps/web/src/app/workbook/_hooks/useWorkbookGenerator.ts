"use client";

import { useCallback } from "react";
import type { HandoutSection, PassageWorkbook } from "@gyoanmaker/shared/types";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

export function useWorkbookGenerator() {
  const selectedModel = useWorkbookStore((state) => state.selectedModel);
  const setWorkbookData = useWorkbookStore((state) => state.setWorkbookData);
  const setGenerating = useWorkbookStore((state) => state.setGenerating);
  const setGenerateError = useWorkbookStore((state) => state.setGenerateError);

  const generate = useCallback(
    async (sections: Record<string, HandoutSection>): Promise<boolean> => {
      setGenerating(true);
      setGenerateError(null);

      try {
        const passages = Object.entries(sections)
          .filter(([, section]) => section.isParsed)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([passageId, section]) => ({
            passageId,
            sentences: section.sentences.map((sentence) => sentence.en).filter(Boolean),
          }))
          .filter((entry) => entry.sentences.length > 0);

        if (passages.length === 0) {
          throw new Error("워크북 생성에 필요한 파싱된 지문이 없습니다.");
        }

        const res = await fetch("/api/workbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passages,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          const error = (await res.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          throw new Error(error?.error?.message ?? "워크북 생성에 실패했습니다.");
        }

        const data = (await res.json()) as { passages?: PassageWorkbook[] };

        if (!Array.isArray(data.passages)) {
          throw new Error("워크북 응답 데이터가 올바르지 않습니다.");
        }

        setWorkbookData({
          passages: data.passages,
          model: selectedModel,
          generatedAt: new Date().toISOString(),
        });
        return true;
      } catch (error) {
        setGenerateError(
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
        );
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [selectedModel, setWorkbookData, setGenerating, setGenerateError]
  );

  return { generate };
}
