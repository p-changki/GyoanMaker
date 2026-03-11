"use client";

import { useCallback } from "react";
import type { HandoutSection, VocabBankItem } from "@gyoanmaker/shared/types";
import { useVocabBankStore } from "@/stores/useVocabBankStore";
import { useHandoutStore } from "@/stores/useHandoutStore";

export function useVocabBankGenerator() {
  const handoutModel = useHandoutStore((state) => state.handoutModel);
  const setVocabBankData = useVocabBankStore((state) => state.setVocabBankData);
  const setGenerating = useVocabBankStore((state) => state.setGenerating);
  const setGenerateError = useVocabBankStore((state) => state.setGenerateError);

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
            sentences: section.sentences
              .map((sentence) => sentence.en)
              .filter(Boolean),
          }))
          .filter((entry) => entry.sentences.length > 0);

        if (passages.length === 0) {
          throw new Error("보카 생성에 필요한 파싱된 지문이 없습니다.");
        }

        const res = await fetch("/api/vocab-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passages,
            model: handoutModel,
          }),
        });

        if (!res.ok) {
          const error = (await res.json().catch(() => null)) as
            | { error?: { code?: string; message?: string } }
            | null;
          if (res.status === 429 && error?.error?.code === "QUOTA_EXCEEDED") {
            const model = handoutModel === "flash" ? "빠른 생성" : "정밀 생성";
            throw new Error(
              `QUOTA_EXCEEDED:${model} 사용량 한도를 초과했습니다. 플랜을 업그레이드하거나 다음 달까지 기다려주세요.`
            );
          }
          throw new Error(error?.error?.message ?? "보카 생성에 실패했습니다.");
        }

        // Read SSE stream (heartbeats keep Cloudflare connection alive)
        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

        const decoder = new TextDecoder();
        let buffer = "";
        let finalPayload: Record<string, unknown> | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                finalPayload = JSON.parse(line.slice(6)) as Record<string, unknown>;
              } catch {
                // ignore malformed SSE data line
              }
            }
            // lines starting with ":" are heartbeat comments — ignore
          }
        }

        if (!finalPayload) {
          throw new Error("보카 응답 데이터가 올바르지 않습니다.");
        }

        if (finalPayload.__status || finalPayload.error) {
          const errMsg = (finalPayload.error as { message?: string } | undefined)
            ?.message;
          throw new Error(errMsg ?? "보카 생성에 실패했습니다.");
        }

        const data = finalPayload as { items?: VocabBankItem[] };

        if (!Array.isArray(data.items)) {
          throw new Error("보카 응답 데이터가 올바르지 않습니다.");
        }

        setVocabBankData({
          items: data.items,
          model: handoutModel,
          generatedAt: new Date().toISOString(),
        });

        return true;
      } catch (error) {
        setGenerateError(
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다."
        );
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [handoutModel, setGenerateError, setGenerating, setVocabBankData]
  );

  return { generate };
}
