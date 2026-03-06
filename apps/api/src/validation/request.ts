import { z } from "zod";

export const MAX_PASSAGES = 20;
const MAX_PASSAGE_CHARS = 5000;
const MAX_WORDS_PER_PASSAGE = 400;
const MAX_TOTAL_WORDS = 5000;

type ContentLevel = "advanced" | "basic";
type ModelTier = "pro" | "flash";

const generateBodySchema = z.object({
  passages: z.array(z.string()).min(1).max(MAX_PASSAGES),
  level: z.enum(["advanced", "basic"]).optional(),
  model: z.enum(["pro", "flash"]).optional(),
  mode: z.enum(["basic", "flash"]).optional(),
});

export interface ValidGenerateRequest {
  ok: true;
  passages: string[];
  level: ContentLevel;
  model: ModelTier;
}

export interface InvalidGenerateRequest {
  ok: false;
  status: number;
  code: string;
  message: string;
}

export type ValidateGenerateRequestResult =
  | ValidGenerateRequest
  | InvalidGenerateRequest;

export function validateGenerateRequest(body: unknown): ValidateGenerateRequestResult {
  const parsed = generateBodySchema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      message:
        "Request body must be { passages: string[] } with 1 to 20 items.",
    };
  }

  const normalizedPassages = parsed.data.passages.map((passage) =>
    passage.trim()
  );

  const emptyIndex = normalizedPassages.findIndex(
    (passage) => passage.length === 0
  );
  if (emptyIndex !== -1) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      message: `passages[${emptyIndex}] must not be empty.`,
    };
  }

  const overLimitIndex = normalizedPassages.findIndex(
    (passage) => passage.length > MAX_PASSAGE_CHARS
  );
  if (overLimitIndex !== -1) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      message: `passages[${overLimitIndex}] exceeds ${MAX_PASSAGE_CHARS} characters.`,
    };
  }

  let totalWords = 0;
  for (let i = 0; i < normalizedPassages.length; i += 1) {
    const words = normalizedPassages[i].trim().split(/\s+/).filter(Boolean).length;
    totalWords += words;
    if (words > MAX_WORDS_PER_PASSAGE) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_REQUEST",
        message: `passages[${i}] exceeds ${MAX_WORDS_PER_PASSAGE} words (${words} words).`,
      };
    }
  }

  if (totalWords > MAX_TOTAL_WORDS) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_REQUEST",
      message: `Total word count (${totalWords}) exceeds maximum of ${MAX_TOTAL_WORDS}.`,
    };
  }

  let level: ContentLevel = parsed.data.level ?? "advanced";
  let model: ModelTier = parsed.data.model ?? "pro";

  if (!parsed.data.level && !parsed.data.model && parsed.data.mode) {
    if (parsed.data.mode === "flash") {
      level = "advanced";
      model = "flash";
    } else {
      level = "advanced";
      model = "pro";
    }
  }

  return {
    ok: true,
    passages: normalizedPassages,
    level,
    model,
  };
}
