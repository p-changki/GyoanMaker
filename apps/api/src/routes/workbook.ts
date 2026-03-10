import { Router, type RequestHandler, type Response } from "express";
import { requireApiKey } from "../middleware/auth";
import {
  type PassageWorkbook,
  generateWorkbookForPassage,
  type WorkbookTokenUsage,
} from "../services/workbookGenerator";
import { createGeminiClient } from "../services/gemini";
import { getSystemPrompt } from "../services/prompt";
import { workbookBodySchema } from "../validation/workbook";

const DEFAULT_FLASH_CONCURRENCY = 3;
const DEFAULT_PRO_CONCURRENCY = 2;
const MAX_CONCURRENCY = 8;

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

function mergeUsage(a: WorkbookTokenUsage, b: WorkbookTokenUsage): WorkbookTokenUsage {
  return {
    inputTokens: (a.inputTokens || 0) + (b.inputTokens || 0),
    outputTokens: (a.outputTokens || 0) + (b.outputTokens || 0),
    totalTokens: (a.totalTokens || 0) + (b.totalTokens || 0),
  };
}

function toPositiveInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
}

function getWorkbookConcurrency(model: "flash" | "pro", passageCount: number): number {
  const fallback =
    model === "flash" ? DEFAULT_FLASH_CONCURRENCY : DEFAULT_PRO_CONCURRENCY;
  const envKey =
    model === "flash"
      ? process.env.WORKBOOK_FLASH_CONCURRENCY
      : process.env.WORKBOOK_PRO_CONCURRENCY;
  const configured = toPositiveInt(envKey, fallback, 1, MAX_CONCURRENCY);
  return Math.min(configured, Math.max(1, passageCount));
}

function normalizePassages(passages: PassageWorkbook[]): PassageWorkbook[] {
  let step2QuestionNumber = 1;
  let step3QuestionNumber = 1;

  return passages.map((passage, passageIndex) => ({
    ...passage,
    step2Items: passage.step2Items.map((item) => ({
      ...item,
      questionNumber: step2QuestionNumber++,
    })),
    step3Items: passage.step3Items.map((item) => ({
      ...item,
      questionNumber: step3QuestionNumber++,
      passageNumber: passageIndex + 1,
    })),
  }));
}

export function createWorkbookRouter(workbookRateLimit: RequestHandler): Router {
  const router = Router();

  router.post("/", workbookRateLimit, requireApiKey, async (req, res) => {
    const parsed = workbookBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        400,
        "INVALID_REQUEST",
        "Request body must include passages[] and model."
      );
      return;
    }

    const systemPrompt = getSystemPrompt("workbook");
    if (!systemPrompt) {
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "Workbook system prompt is not configured."
      );
      return;
    }

    let ai;
    try {
      ai = createGeminiClient();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/workbook] Gemini client init failed:", detail);
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "Server configuration is invalid."
      );
      return;
    }

    try {
      const inputs = parsed.data.passages.map((passage) => ({
        passageId: passage.passageId.trim(),
        sentences: passage.sentences.map((sentence) => sentence.trim()),
      }));

      const concurrency = getWorkbookConcurrency(parsed.data.model, inputs.length);
      console.info(
        `[api/workbook] start model=${parsed.data.model} passages=${inputs.length} concurrency=${concurrency}`
      );

      const generatedByIndex = new Array<PassageWorkbook | null>(inputs.length).fill(
        null
      );
      const usageByIndex = new Array<WorkbookTokenUsage>(inputs.length).fill({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      });

      let cursor = 0;
      const runWorker = async (workerNumber: number): Promise<void> => {
        while (true) {
          const currentIndex = cursor;
          cursor += 1;
          if (currentIndex >= inputs.length) return;

          const input = inputs[currentIndex];
          console.info(
            `[api/workbook] worker=${workerNumber} generating ${currentIndex + 1}/${inputs.length} (${input.passageId})`
          );

          const result = await generateWorkbookForPassage(
            ai,
            systemPrompt,
            input,
            parsed.data.model
          );
          generatedByIndex[currentIndex] = result.passage;
          usageByIndex[currentIndex] = result.usage;

          console.info(
            `[api/workbook] worker=${workerNumber} done ${currentIndex + 1}/${inputs.length} (${input.passageId})`
          );
        }
      };

      await Promise.all(
        Array.from({ length: concurrency }, (_, index) => runWorker(index + 1))
      );

      if (generatedByIndex.some((passage) => passage === null)) {
        throw new Error("Workbook generation produced incomplete results.");
      }

      const totalUsage = usageByIndex.reduce<WorkbookTokenUsage>(mergeUsage, {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      });

      const passages = normalizePassages(generatedByIndex as PassageWorkbook[]);
      res.json({ passages, totalUsage });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/workbook] generation failed:", detail);
      sendError(res, 502, "GENERATION_FAILED", "Workbook generation failed.");
    }
  });

  return router;
}
