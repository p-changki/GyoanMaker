import { Router, type RequestHandler, type Response } from "express";
import { requireApiKey } from "../middleware/auth";
import { createGeminiClient } from "../services/gemini";
import {
  generateVocabBank,
  type VocabBankPassageInput,
} from "../services/vocabBankGenerator";
import { getSystemPrompt } from "../services/prompt";
import { vocabBankBodySchema } from "../validation/vocabBank";

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

export function createVocabBankRouter(vocabBankRateLimit: RequestHandler): Router {
  const router = Router();

  router.post("/", vocabBankRateLimit, requireApiKey, async (req, res) => {
    const parsed = vocabBankBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        400,
        "INVALID_REQUEST",
        "Request body must include passages[] and model."
      );
      return;
    }

    const systemPrompt = getSystemPrompt("vocabBank");
    if (!systemPrompt) {
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "Vocab bank system prompt is not configured."
      );
      return;
    }

    let ai;
    try {
      ai = createGeminiClient();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/vocab-bank] Gemini client init failed:", detail);
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "Server configuration is invalid."
      );
      return;
    }

    try {
      const inputs: VocabBankPassageInput[] = parsed.data.passages.map((passage) => ({
        passageId: passage.passageId.trim(),
        sentences: passage.sentences.map((sentence) => sentence.trim()),
      }));

      console.info(
        `[api/vocab-bank] start model=${parsed.data.model} passages=${inputs.length}`
      );

      const result = await generateVocabBank(
        ai,
        systemPrompt,
        inputs,
        parsed.data.model
      );

      res.json({
        items: result.items,
        totalUsage: result.usage,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/vocab-bank] generation failed:", detail);
      sendError(res, 502, "GENERATION_FAILED", "Vocab bank generation failed.");
    }
  });

  return router;
}
