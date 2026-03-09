"use client";

import { useQuery } from "@tanstack/react-query";
import { parseHandoutSection } from "@/lib/parseHandout";
import type { VocabItem } from "@gyoanmaker/shared/types/handout";

interface HandoutDetailResponse {
  id: string;
  title: string;
  sections: Record<string, string>;
}

export interface HandoutVocabResult {
  handoutId: string;
  handoutTitle: string;
  vocabItems: VocabItem[];
  passageIds: string[];
}

async function fetchHandoutVocab(handoutId: string): Promise<HandoutVocabResult> {
  const res = await fetch(`/api/handouts/${handoutId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch handout.");
  }

  const handout = (await res.json()) as HandoutDetailResponse;
  const vocabItems: VocabItem[] = [];
  const passageIds: string[] = [];

  const entries = Object.entries(handout.sections ?? {}).sort(([a], [b]) => a.localeCompare(b));
  for (const [passageId, rawText] of entries) {
    const section = parseHandoutSection(passageId, rawText);
    for (const vocab of section.vocabulary) {
      vocabItems.push(vocab);
      passageIds.push(passageId);
    }
  }

  return {
    handoutId: handout.id,
    handoutTitle: handout.title,
    vocabItems,
    passageIds,
  };
}

export function useHandoutVocab(handoutId: string | null) {
  return useQuery({
    queryKey: ["handout-vocab", handoutId],
    enabled: Boolean(handoutId),
    queryFn: () => fetchHandoutVocab(handoutId as string),
  });
}
