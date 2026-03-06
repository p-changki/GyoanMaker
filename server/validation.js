const { z } = require("zod");

const MAX_PASSAGES = 20;
const MAX_PASSAGE_CHARS = 5000;
const MAX_WORDS_PER_PASSAGE = 400;
const MAX_TOTAL_WORDS = 5000;

const generateBodySchema = z.object({
  passages: z.array(z.string()).min(1).max(MAX_PASSAGES),
  level: z.enum(["advanced", "basic"]).optional(),
  model: z.enum(["pro", "flash"]).optional(),
  // Legacy: "mode" field for backward compatibility
  mode: z.enum(["basic", "flash"]).optional(),
});

function validateGenerateRequest(body) {
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

  // Word count limits (mirrors frontend validation)
  let totalWords = 0;
  for (let i = 0; i < normalizedPassages.length; i++) {
    const words = normalizedPassages[i]
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
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

  // Resolve level + model from new fields or legacy "mode" field
  let level = parsed.data.level || "advanced";
  let model = parsed.data.model || "pro";

  if (!parsed.data.level && !parsed.data.model && parsed.data.mode) {
    // Legacy backward compatibility: mode → level + model
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

module.exports = {
  MAX_PASSAGES,
  validateGenerateRequest,
};
