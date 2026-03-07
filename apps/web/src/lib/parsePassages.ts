import { PassageInput } from "@gyoanmaker/shared/types";

const RECOMMENDED_MIN_WORDS = 80;
const RECOMMENDED_MAX_WORDS = 250;
const MAX_WORDS_PER_PASSAGE = 400;
const MAX_TOTAL_WORDS = 5000;

export {
  RECOMMENDED_MIN_WORDS,
  RECOMMENDED_MAX_WORDS,
  MAX_WORDS_PER_PASSAGE,
  MAX_TOTAL_WORDS,
};

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type PassageLengthStatus = "short" | "ok" | "long" | "over_limit";

export function getPassageLengthStatus(text: string): PassageLengthStatus {
  const words = countWords(text);
  if (words > MAX_WORDS_PER_PASSAGE) return "over_limit";
  if (words < RECOMMENDED_MIN_WORDS) return "short";
  if (words > RECOMMENDED_MAX_WORDS) return "long";
  return "ok";
}

export function splitTextBlockIntoPassages(
  text: string,
  limit: number = 20
): string[] {
  if (!text) return [];

  const passages = text.split(/^\s*---\s*$/m);

  return normalizePassages(passages, limit);
}

export function passagesToTextBlock(passages: string[]): string {
  return passages
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join("\n\n---\n\n");
}

export function passagesToCards(passages: string[]): PassageInput[] {
  return passages
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((text, index) => ({
      id: `p${String(index + 1).padStart(2, "0")}`,
      text,
    }));
}

export function cardsToPassages(cards: PassageInput[]): string[] {
  return cards
    .map((card) => card.text.trim())
    .filter((text) => text.length > 0);
}

export function normalizePassages(
  passages: string[],
  limit: number = 20
): string[] {
  return passages
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, limit);
}

export interface PassageLimitError {
  type: "per_passage" | "total";
  message: string;
  passageIndices?: number[];
}

export function validatePassageLimits(
  passages: string[]
): PassageLimitError | null {
  const overIndices: number[] = [];
  let totalWords = 0;

  for (let i = 0; i < passages.length; i++) {
    const words = countWords(passages[i]);
    totalWords += words;
    if (words > MAX_WORDS_PER_PASSAGE) {
      overIndices.push(i);
    }
  }

  if (overIndices.length > 0) {
    const labels = overIndices
      .map((i) => `P${String(i + 1).padStart(2, "0")}`)
      .join(", ");
    return {
      type: "per_passage",
      message: `${labels} passage(s) exceed ${MAX_WORDS_PER_PASSAGE} words. Please split or shorten them.`,
      passageIndices: overIndices,
    };
  }

  if (totalWords > MAX_TOTAL_WORDS) {
    return {
      type: "total",
      message: `Total word count (${totalWords.toLocaleString()}) exceeds maximum of ${MAX_TOTAL_WORDS.toLocaleString()} words.`,
    };
  }

  return null;
}
