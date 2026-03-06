import { type ApiResultItem } from "@/services/api";
import { normalizeHandoutRawText } from "@/lib/normalizeHandoutRawText";
import { type HandoutSection } from "@gyoanmaker/shared/types/handout";

export const INPUT_STORAGE_KEY = "gyoanmaker:input";
export const INPUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
export const COMPILED_PREFIX = "gyoanmaker:compiled:";

export interface CompileInputData {
  passages: string[];
  hash: string;
  level: string;
  model: string;
}

export function normalizeRawExportText(text: string): string {
  return normalizeHandoutRawText(text);
}

export function createInitialSections(
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
