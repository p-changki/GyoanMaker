import { z } from "zod";

export interface WorkbookWarning {
  code: string;
  message: string;
  severity: "warning" | "error";
}

/**
 * Runs 4 quality checks on a STEP3 item's paragraphs and returns warnings.
 * Does NOT discard the item — caller decides how to handle warnings.
 *
 * Checks:
 * 1. DUPLICATE_SEGMENT   — any two paragraphs share identical text
 * 2. SHORT_SEGMENT       — any paragraph has fewer than 2 sentences
 * 3. LOW_COVERAGE        — total paragraph text length < 60 chars
 * 4. UNBALANCED_LENGTH   — longest paragraph > 3× shortest paragraph
 */
export function validateStep3Item(
  paragraphs: Array<{ label: string; text: string }>,
  itemIndex: number
): WorkbookWarning[] {
  const warnings: WorkbookWarning[] = [];

  if (paragraphs.length === 0) return warnings;

  const texts = paragraphs
    .map((p) => (typeof p.text === "string" ? p.text.trim() : ""))
    .filter(Boolean);

  // 1. Duplicate segment detection
  const uniqueTexts = new Set(texts);
  if (uniqueTexts.size < texts.length) {
    warnings.push({
      code: "DUPLICATE_SEGMENT",
      message: `step3Items[${itemIndex}] contains ${texts.length - uniqueTexts.size} duplicate paragraph text(s).`,
      severity: "error",
    });
  }

  // 2. Minimum 2 sentences per segment
  const shortParagraphLabels = paragraphs
    .filter((p) => {
      const text = typeof p.text === "string" ? p.text.trim() : "";
      const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
      return sentences.length < 2;
    })
    .map((p) => p.label);

  if (shortParagraphLabels.length > 0) {
    warnings.push({
      code: "SHORT_SEGMENT",
      message: `step3Items[${itemIndex}] paragraph(s) [${shortParagraphLabels.join(", ")}] have fewer than 2 sentences.`,
      severity: "warning",
    });
  }

  // 3. Coverage check — total text should be at least 60 chars
  const totalLength = texts.join(" ").length;
  if (totalLength < 60) {
    warnings.push({
      code: "LOW_COVERAGE",
      message: `step3Items[${itemIndex}] total paragraph text (${totalLength} chars) may be too short for adequate passage coverage.`,
      severity: "warning",
    });
  }

  // 4. Length balance — no single segment >3× longer than the shortest
  if (texts.length >= 2) {
    const lengths = texts.map((t) => t.length);
    const minLen = Math.min(...lengths);
    const maxLen = Math.max(...lengths);
    if (minLen > 0 && maxLen > minLen * 3) {
      warnings.push({
        code: "UNBALANCED_LENGTH",
        message: `step3Items[${itemIndex}] paragraph lengths are unbalanced (min=${minLen}, max=${maxLen}, ratio=${(maxLen / minLen).toFixed(1)}x).`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

export const workbookBodySchema = z.object({
  passages: z
    .array(
      z.object({
        passageId: z.string().min(1),
        sentences: z.array(z.string().min(1)).min(1).max(50),
      })
    )
    .min(1)
    .max(20),
  model: z.enum(["pro", "flash"]),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeType(value: unknown): "3p" | "4p" | null {
  if (value === "3p" || value === "4p") {
    return value;
  }
  return null;
}

/** AI 출력 검증 */
export function validateWorkbookOutput(
  output: unknown,
  sentenceCount: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isRecord(output)) {
    return { valid: false, errors: ["Output must be an object."] };
  }

  if (!isNonEmptyString(output.passageId)) {
    errors.push("passageId is required.");
  }

  if (!isNonEmptyString(output.passageTitle)) {
    errors.push("passageTitle is required.");
  }

  const step2Items = output.step2Items;
  if (!Array.isArray(step2Items)) {
    errors.push("step2Items must be an array.");
  } else {
    if (step2Items.length > sentenceCount) {
      errors.push(
        `STEP 2 item count (${step2Items.length}) exceeds sentence count (${sentenceCount}).`
      );
    } else if (step2Items.length === 0) {
      errors.push("STEP 2 must have at least one item.");
    }

    step2Items.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`step2Items[${index}] must be an object.`);
        return;
      }

      if (!Number.isInteger(item.sentenceIndex)) {
        errors.push(`step2Items[${index}].sentenceIndex must be an integer.`);
      }
      if (!Number.isInteger(item.questionNumber)) {
        errors.push(`step2Items[${index}].questionNumber must be an integer.`);
      }
      if (!isNonEmptyString(item.sentenceTemplate)) {
        errors.push(
          `step2Items[${index}].sentenceTemplate must be a non-empty string.`
        );
      }

      const choices = item.choices;
      if (!Array.isArray(choices) || choices.length < 1 || choices.length > 3) {
        errors.push(`step2Items[${index}].choices must have 1~3 items.`);
      } else {
        choices.forEach((choice, choiceIndex) => {
          if (!isRecord(choice)) {
            errors.push(
              `step2Items[${index}].choices[${choiceIndex}] must be an object.`
            );
            return;
          }
          if (!isNonEmptyString(choice.correct)) {
            errors.push(
              `step2Items[${index}].choices[${choiceIndex}].correct is required.`
            );
          }
          if (!isNonEmptyString(choice.wrong)) {
            errors.push(
              `step2Items[${index}].choices[${choiceIndex}].wrong is required.`
            );
          }
        });
      }

      if (!Array.isArray(item.answerKey)) {
        errors.push(`step2Items[${index}].answerKey must be an array.`);
      }
    });
  }

  const step3Items = output.step3Items;
  if (!Array.isArray(step3Items)) {
    errors.push("step3Items must be an array.");
  } else {
    // Passages with fewer than 8 sentences cannot produce valid STEP3 items;
    // an empty array is expected and valid for short passages.
    if (sentenceCount >= 8 && step3Items.length < 1) {
      errors.push("STEP 3 item count must be 1~3.");
    } else if (step3Items.length > 3) {
      errors.push("STEP 3 item count must not exceed 3.");
    }

    step3Items.forEach((item, index) => {
      if (!isRecord(item)) {
        errors.push(`step3Items[${index}] must be an object.`);
        return;
      }

      if (!Number.isInteger(item.questionNumber)) {
        errors.push(`step3Items[${index}].questionNumber must be an integer.`);
      }
      if (!Number.isInteger(item.passageNumber)) {
        errors.push(`step3Items[${index}].passageNumber must be an integer.`);
      }
      if (!isNonEmptyString(item.intro)) {
        errors.push(`step3Items[${index}].intro must be a non-empty string.`);
      }

      const type = normalizeType(item.type);
      if (!type) {
        errors.push(`step3Items[${index}].type must be "3p" or "4p".`);
      }

      const paragraphs = item.paragraphs;
      if (!Array.isArray(paragraphs)) {
        errors.push(`step3Items[${index}].paragraphs must be an array.`);
      } else {
        if (type === "3p" && paragraphs.length !== 3) {
          errors.push(`step3Items[${index}] type=3p requires 3 paragraphs.`);
        }
        if (type === "4p" && paragraphs.length !== 4) {
          errors.push(`step3Items[${index}] type=4p requires 4 paragraphs.`);
        }

        paragraphs.forEach((paragraph, paragraphIndex) => {
          if (!isRecord(paragraph)) {
            errors.push(
              `step3Items[${index}].paragraphs[${paragraphIndex}] must be an object.`
            );
            return;
          }
          if (!isNonEmptyString(paragraph.label)) {
            errors.push(
              `step3Items[${index}].paragraphs[${paragraphIndex}].label is required.`
            );
          }
          if (!isNonEmptyString(paragraph.text)) {
            errors.push(
              `step3Items[${index}].paragraphs[${paragraphIndex}].text is required.`
            );
          }
        });
      }

      if (!Array.isArray(item.options) || item.options.length !== 5) {
        errors.push(`step3Items[${index}].options must have exactly 5 items.`);
      } else {
        item.options.forEach((option, optionIndex) => {
          if (!Array.isArray(option) || option.length === 0) {
            errors.push(
              `step3Items[${index}].options[${optionIndex}] must be a non-empty array.`
            );
          }
        });
      }

      const answerIndex = item.answerIndex;
      if (
        typeof answerIndex !== "number" ||
        !Number.isInteger(answerIndex) ||
        answerIndex < 0 ||
        answerIndex > 4
      ) {
        errors.push(`step3Items[${index}].answerIndex must be 0~4.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
