import { PassageInput } from "./types";

export function splitTextBlockIntoPassages(text: string, limit: number = 20): string[] {
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

export function normalizePassages(passages: string[], limit: number = 20): string[] {
  return passages
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .slice(0, limit);
}
