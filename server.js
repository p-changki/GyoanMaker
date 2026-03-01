/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { createGeminiClient, generateOnePassage } = require("./server/gemini");
const {
  processSequential,
  processBoundedParallel,
} = require("./server/processor");
const { validateGenerateRequest } = require("./server/validation");
const { getSystemPrompt } = require("./server/prompt");

const app = express();

const PORT = Number(process.env.PORT || 4000);
const PROCESSING_MODE = process.env.PROCESSING_MODE || "sequential";
const PARALLEL_LIMIT = Number(process.env.PARALLEL_LIMIT || 3);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

function sendError(res, status, code, message) {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

app.get("/health", (_req, res) => {
  return res.json({ ok: true });
});

app.post("/generate", async (req, res) => {
  // 1. SYSTEM_PROMPT 검증
  const systemPrompt = getSystemPrompt();
  if (!systemPrompt) {
    return sendError(
      res,
      500,
      "SERVER_MISCONFIGURED",
      "SYSTEM_PROMPT or SYSTEM_PROMPT_B64 environment variable is required."
    );
  }

  // 2. 요청 본문 검증
  const validated = validateGenerateRequest(req.body);
  if (!validated.ok) {
    return sendError(res, validated.status, validated.code, validated.message);
  }

  // 3. Gemini 클라이언트 생성
  let ai;
  try {
    ai = createGeminiClient();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return sendError(res, 500, "SERVER_MISCONFIGURED", detail);
  }

  // 4. 생성 실행
  try {
    const generateOne = (passage) =>
      generateOnePassage(ai, systemPrompt, passage);

    const results =
      PROCESSING_MODE === "parallel"
        ? await processBoundedParallel(
            validated.passages,
            generateOne,
            PARALLEL_LIMIT
          )
        : await processSequential(validated.passages, generateOne);

    return res.json({ results });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return sendError(
      res,
      502,
      "GENERATION_FAILED",
      `Gemini generation failed: ${detail}`
    );
  }
});

app.use((_req, res) => {
  return sendError(res, 404, "NOT_FOUND", "Route not found.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
  console.log(
    `[api] SYSTEM_PROMPT: ${getSystemPrompt() ? "loaded" : "⚠ NOT SET"}`
  );
  console.log(`[api] mode: ${PROCESSING_MODE}`);
});
