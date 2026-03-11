import { z } from "zod";

export const pocketVocaBodySchema = z.object({
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

export interface PocketVocaSynAntItem {
  word: string;
  meaningKo: string;
}

export interface PocketVocaWordItem {
  word: string;
  partOfSpeech: string;
  meaningKo: string;
  synonyms: PocketVocaSynAntItem[];
  antonyms: PocketVocaSynAntItem[];
}

export interface PocketVocaPassageOutput {
  passageId: string;
  items: PocketVocaWordItem[];
}

export interface PocketVocaOutput {
  passages: PocketVocaPassageOutput[];
}

const MIN_ITEMS = 7;
const MAX_ITEMS = 10;
const REQUIRED_SYN_ANT = 5;

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
  if (trimmed === "adj" || trimmed === "adjective" || trimmed === "adj.") return "adj.";
  if (trimmed === "adv" || trimmed === "adverb" || trimmed === "adv.") return "adv.";
  return value.trim();
}

function normalizeSynAnt(value: unknown): PocketVocaSynAntItem[] {
  if (!Array.isArray(value)) return [];
  const result: PocketVocaSynAntItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const word = isNonEmptyString(entry.word) ? entry.word.trim() : "";
    const meaningKo = isNonEmptyString(entry.meaningKo) ? entry.meaningKo.trim() : "";
    if (!word || !meaningKo) continue;
    result.push({ word, meaningKo });
  }
  // clamp to required count
  return result.slice(0, REQUIRED_SYN_ANT);
}

export function repairPocketVocaOutput(
  output: unknown,
  validPassageIds: string[]
): PocketVocaOutput {
  if (!isRecord(output) || !Array.isArray(output.passages)) {
    return { passages: [] };
  }

  const passages: PocketVocaPassageOutput[] = output.passages
    .map((entry) => {
      if (!isRecord(entry)) return null;

      const passageId = isNonEmptyString(entry.passageId) ? entry.passageId.trim() : "";
      if (!passageId || !validPassageIds.includes(passageId)) return null;

      if (!Array.isArray(entry.items)) return null;

      const items: PocketVocaWordItem[] = entry.items
        .map((item) => {
          if (!isRecord(item)) return null;

          const word = isNonEmptyString(item.word) ? item.word.trim() : "";
          const partOfSpeech = normalizePartOfSpeech(item.partOfSpeech);
          const meaningKo = isNonEmptyString(item.meaningKo) ? item.meaningKo.trim() : "";
          const synonyms = normalizeSynAnt(item.synonyms);
          const antonyms = normalizeSynAnt(item.antonyms);

          if (!word || !partOfSpeech || !meaningKo) return null;

          return { word, partOfSpeech, meaningKo, synonyms, antonyms };
        })
        .filter((item): item is PocketVocaWordItem => item !== null)
        .slice(0, MAX_ITEMS);

      if (items.length === 0) return null;

      return { passageId, items };
    })
    .filter((p): p is PocketVocaPassageOutput => p !== null);

  return { passages };
}

export function validatePocketVocaOutput(
  output: unknown,
  validPassageIds: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(output)) {
    return { valid: false, errors: ["Output must be an object."] };
  }

  if (!Array.isArray(output.passages)) {
    return { valid: false, errors: ["passages must be an array."] };
  }

  if (output.passages.length !== validPassageIds.length) {
    errors.push(
      `Expected ${validPassageIds.length} passages, got ${output.passages.length}.`
    );
  }

  output.passages.forEach((passage, pIdx) => {
    if (!isRecord(passage)) {
      errors.push(`passages[${pIdx}] must be an object.`);
      return;
    }

    if (!isNonEmptyString(passage.passageId)) {
      errors.push(`passages[${pIdx}].passageId is required.`);
    } else if (!validPassageIds.includes(passage.passageId.trim())) {
      errors.push(`passages[${pIdx}].passageId "${passage.passageId}" is not a valid passage.`);
    }

    if (!Array.isArray(passage.items)) {
      errors.push(`passages[${pIdx}].items must be an array.`);
      return;
    }

    if (passage.items.length < MIN_ITEMS || passage.items.length > MAX_ITEMS) {
      errors.push(
        `passages[${pIdx}].items count ${passage.items.length} is out of range [${MIN_ITEMS}, ${MAX_ITEMS}].`
      );
    }

    passage.items.forEach((item, iIdx) => {
      if (!isRecord(item)) {
        errors.push(`passages[${pIdx}].items[${iIdx}] must be an object.`);
        return;
      }

      if (!isNonEmptyString(item.word)) {
        errors.push(`passages[${pIdx}].items[${iIdx}].word is required.`);
      }

      if (!isNonEmptyString(item.partOfSpeech)) {
        errors.push(`passages[${pIdx}].items[${iIdx}].partOfSpeech is required.`);
      }

      if (!isNonEmptyString(item.meaningKo)) {
        errors.push(`passages[${pIdx}].items[${iIdx}].meaningKo is required.`);
      }

      ["synonyms", "antonyms"].forEach((field) => {
        const arr = item[field];
        if (!Array.isArray(arr)) {
          errors.push(`passages[${pIdx}].items[${iIdx}].${field} must be an array.`);
          return;
        }
        if (arr.length !== REQUIRED_SYN_ANT) {
          errors.push(
            `passages[${pIdx}].items[${iIdx}].${field} must have exactly ${REQUIRED_SYN_ANT} entries, got ${arr.length}.`
          );
        }
        arr.forEach((entry, eIdx) => {
          if (!isRecord(entry)) {
            errors.push(
              `passages[${pIdx}].items[${iIdx}].${field}[${eIdx}] must be an object.`
            );
            return;
          }
          if (!isNonEmptyString(entry.word)) {
            errors.push(
              `passages[${pIdx}].items[${iIdx}].${field}[${eIdx}].word is required.`
            );
          }
          if (!isNonEmptyString(entry.meaningKo)) {
            errors.push(
              `passages[${pIdx}].items[${iIdx}].${field}[${eIdx}].meaningKo is required.`
            );
          }
        });
      });
    });
  });

  return { valid: errors.length === 0, errors };
}
