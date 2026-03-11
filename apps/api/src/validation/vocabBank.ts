import { z } from "zod";

export const vocabBankBodySchema = z.object({
  passages: z
    .array(
      z.object({
        passageId: z.string().min(1).max(50),
        sentences: z.array(z.string().min(1)).min(1).max(50),
      })
    )
    .min(1)
    .max(20),
  model: z.enum(["pro", "flash"]),
});

export interface VocabBankItem {
  word: string;
  partOfSpeech: string;
  meaningKo: string;
  sourcePassageIds: string[];
}

export interface VocabBankOutput {
  items: VocabBankItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizePartOfSpeech(value: unknown): string {
  if (!isNonEmptyString(value)) return "";

  const trimmed = value.trim().toLowerCase();
  if (trimmed === "n" || trimmed === "noun" || trimmed === "n.") return "n.";
  if (trimmed === "v" || trimmed === "verb" || trimmed === "v.") return "v.";
  if (
    trimmed === "adj" ||
    trimmed === "adjective" ||
    trimmed === "adj."
  ) {
    return "adj.";
  }
  if (trimmed === "adv" || trimmed === "adverb" || trimmed === "adv.") {
    return "adv.";
  }
  return value.trim();
}

function normalizeSourcePassageIds(
  value: unknown,
  validPassageIds: Set<string>
): string[] {
  if (!Array.isArray(value)) return [];

  const deduped = new Set<string>();
  for (const entry of value) {
    if (!isNonEmptyString(entry)) continue;
    const normalized = entry.trim();
    if (!validPassageIds.has(normalized)) continue;
    deduped.add(normalized);
  }

  return Array.from(deduped);
}

export function sortVocabBankItems(items: VocabBankItem[]): VocabBankItem[] {
  return [...items].sort((a, b) => {
    const byWord = a.word.localeCompare(b.word, "en", { sensitivity: "base" });
    if (byWord !== 0) return byWord;
    return a.partOfSpeech.localeCompare(b.partOfSpeech, "en", {
      sensitivity: "base",
    });
  });
}

function isAlphabeticallySorted(items: VocabBankItem[]): boolean {
  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1];
    const curr = items[i];
    const compare = prev.word.localeCompare(curr.word, "en", {
      sensitivity: "base",
    });
    if (compare > 0) return false;
    if (compare === 0) {
      const posCompare = prev.partOfSpeech.localeCompare(curr.partOfSpeech, "en", {
        sensitivity: "base",
      });
      if (posCompare > 0) return false;
    }
  }
  return true;
}

export function repairVocabBankOutput(
  output: unknown,
  validPassageIdList: string[]
): VocabBankOutput {
  const validPassageIds = new Set(validPassageIdList);

  if (!isRecord(output) || !Array.isArray(output.items)) {
    return { items: [] };
  }

  const normalized: VocabBankItem[] = output.items
    .map((entry) => {
      if (!isRecord(entry)) return null;

      const word = isNonEmptyString(entry.word) ? entry.word.trim() : "";
      const partOfSpeech = normalizePartOfSpeech(entry.partOfSpeech);
      const meaningKo = isNonEmptyString(entry.meaningKo) ? entry.meaningKo.trim() : "";
      const sourcePassageIds = normalizeSourcePassageIds(
        entry.sourcePassageIds,
        validPassageIds
      );

      if (!word || !partOfSpeech || !meaningKo || sourcePassageIds.length === 0) {
        return null;
      }

      return {
        word,
        partOfSpeech,
        meaningKo,
        sourcePassageIds,
      };
    })
    .filter((item): item is VocabBankItem => item !== null);

  return {
    items: sortVocabBankItems(normalized),
  };
}

export function validateVocabBankOutput(
  output: unknown,
  validPassageIdList: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(output)) {
    return { valid: false, errors: ["Output must be an object."] };
  }

  if (!Array.isArray(output.items)) {
    return { valid: false, errors: ["items must be an array."] };
  }

  if (output.items.length < 1) {
    errors.push("items must contain at least 1 item.");
  }

  if (output.items.length > 120) {
    errors.push("items exceeds maximum allowed size (120).");
  }

  const validPassageIds = new Set(validPassageIdList);

  output.items.forEach((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`items[${index}] must be an object.`);
      return;
    }

    if (!isNonEmptyString(entry.word)) {
      errors.push(`items[${index}].word is required.`);
    }

    if (!isNonEmptyString(entry.partOfSpeech)) {
      errors.push(`items[${index}].partOfSpeech is required.`);
    }

    if (!isNonEmptyString(entry.meaningKo)) {
      errors.push(`items[${index}].meaningKo is required.`);
    }

    if (!Array.isArray(entry.sourcePassageIds) || entry.sourcePassageIds.length < 1) {
      errors.push(`items[${index}].sourcePassageIds must contain at least one id.`);
      return;
    }

    entry.sourcePassageIds.forEach((passageId, passageIndex) => {
      if (!isNonEmptyString(passageId)) {
        errors.push(
          `items[${index}].sourcePassageIds[${passageIndex}] must be a non-empty string.`
        );
        return;
      }

      const normalized = passageId.trim();
      if (!validPassageIds.has(normalized)) {
        errors.push(
          `items[${index}].sourcePassageIds[${passageIndex}] is invalid (${normalized}).`
        );
      }
    });
  });

  const typedItems = output.items.filter((item): item is VocabBankItem => {
    return (
      isRecord(item) &&
      isNonEmptyString(item.word) &&
      isNonEmptyString(item.partOfSpeech) &&
      isNonEmptyString(item.meaningKo) &&
      Array.isArray(item.sourcePassageIds)
    );
  });

  if (typedItems.length > 1 && !isAlphabeticallySorted(typedItems)) {
    errors.push("items must be sorted alphabetically by word.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
