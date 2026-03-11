import { Router, type RequestHandler, type Response } from "express";
import { requireApiKey } from "../middleware/auth";
import { createGeminiClient } from "../services/gemini";
import {
  generatePocketVoca,
  type PocketVocaPassageInput,
} from "../services/pocketVocaGenerator";
import { getSystemPrompt } from "../services/prompt";
import { pocketVocaBodySchema } from "../validation/pocketVoca";

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

export function createPocketVocaRouter(pocketVocaRateLimit: RequestHandler): Router {
  const router = Router();

  router.post("/", pocketVocaRateLimit, requireApiKey, async (req, res) => {
    const parsed = pocketVocaBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "INVALID_REQUEST", "Request body must include passages[] and model.");
      return;
    }

    const systemPrompt = getSystemPrompt("pocketVoca");
    if (!systemPrompt) {
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "Pocket voca system prompt is not configured."
      );
      return;
    }

    let ai;
    try {
      ai = createGeminiClient();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/pocket-voca] Gemini client init failed:", detail);
      sendError(res, 500, "SERVER_MISCONFIGURED", "Server configuration is invalid.");
      return;
    }

    try {
      const inputs: PocketVocaPassageInput[] = parsed.data.passages.map((passage) => ({
        passageId: passage.passageId.trim(),
        sentences: passage.sentences.map((s) => s.trim()),
      }));

      console.info(
        `[api/pocket-voca] start model=${parsed.data.model} passages=${inputs.length}`
      );

      const result = await generatePocketVoca(ai, systemPrompt, inputs, parsed.data.model);

      res.json({ passages: result.passages, totalUsage: result.usage });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/pocket-voca] generation failed:", detail);
      sendError(res, 502, "GENERATION_FAILED", "Pocket voca generation failed.");
    }
  });

  return router;
}
