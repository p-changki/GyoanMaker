/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require("zod");

const MAX_PASSAGES = 20;
const MAX_PASSAGE_CHARS = 5000;

const generateBodySchema = z.object({
  passages: z.array(z.string()).min(1).max(MAX_PASSAGES),
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

  return {
    ok: true,
    passages: normalizedPassages,
  };
}

module.exports = {
  MAX_PASSAGES,
  validateGenerateRequest,
};
