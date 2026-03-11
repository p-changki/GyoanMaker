"use client";

import { useCallback } from "react";
import { usePocketVocaStore } from "./usePocketVocaStore";
import type { PocketVocaData, PocketVocaPassage } from "@gyoanmaker/shared/types";

interface PassageInput {
  passageId: string;
  sentences: string[];
}

interface GenerateOptions {
  passages: PassageInput[];
  model: "flash" | "pro";
  handoutId: string;
  handoutTitle: string;
  passageLabels: Record<string, string>;
}

function parseSSEData(line: string): unknown | null {
  if (!line.startsWith("data:")) return null;
  try {
    return JSON.parse(line.slice(5).trim());
  } catch {
    return null;
  }
}

export function usePocketVocaGeneration() {
  const setGeneratedData = usePocketVocaStore((s) => s.setGeneratedData);
  const setIsGenerating = usePocketVocaStore((s) => s.setIsGenerating);
  const setStep = usePocketVocaStore((s) => s.setStep);

  const generate = useCallback(
    async (options: GenerateOptions) => {
      const { passages, model, handoutId, handoutTitle, passageLabels } = options;

      setIsGenerating(true);

      try {
        const response = await fetch("/api/pocket-voca", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passages, model }),
        });

        if (!response.ok || !response.body) {
          const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
          const errorMsg =
            (errorData?.error as { message?: string } | undefined)?.message ??
            "생성 중 오류가 발생했습니다.";
          throw new Error(errorMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalData: unknown = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const data = parseSSEData(line.trim());
            if (data !== null) {
              finalData = data;
            }
          }
        }

        if (!finalData || typeof finalData !== "object") {
          throw new Error("유효한 응답을 받지 못했습니다.");
        }

        const result = finalData as Record<string, unknown>;

        if (result.__status || result.error) {
          const errorMsg =
            (result.error as { message?: string } | undefined)?.message ??
            "생성 중 오류가 발생했습니다.";
          throw new Error(errorMsg);
        }

        const rawPassages = result.passages as Array<{ passageId: string; items: unknown[] }>;
        if (!Array.isArray(rawPassages)) {
          throw new Error("응답 형식이 올바르지 않습니다.");
        }

        const passagesWithLabels: PocketVocaPassage[] = rawPassages.map((p) => ({
          passageId: p.passageId,
          passageLabel: passageLabels[p.passageId] ?? p.passageId,
          items: p.items as PocketVocaPassage["items"],
        }));

        const pocketVocaData: PocketVocaData = {
          passages: passagesWithLabels,
          model,
          generatedAt: new Date().toISOString(),
          handoutId,
          handoutTitle,
        };

        setGeneratedData(pocketVocaData);
        setStep(3);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        throw new Error(msg);
      } finally {
        setIsGenerating(false);
      }
    },
    [setGeneratedData, setIsGenerating, setStep]
  );

  return { generate };
}
