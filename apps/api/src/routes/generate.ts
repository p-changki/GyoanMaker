import { Router, type RequestHandler, type Response } from "express";
import { requireApiKey } from "../middleware/auth";
import {
  createGeminiClient,
  generateOnePassage,
  type TokenUsage,
} from "../services/gemini";
import {
  processBoundedParallel,
  processSequential,
  type ProcessedPassageResult,
} from "../services/processor";
import { getSystemPrompt } from "../services/prompt";
import { validateGenerateRequest } from "../validation/request";

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

interface GenerateRouterOptions {
  generateRateLimit: RequestHandler;
  processingMode: "sequential" | "parallel";
  parallelLimit: number;
}

function sumUsage(results: ProcessedPassageResult[]): TokenUsage {
  return results.reduce(
    (acc, result) => {
      if (!result.usage) return acc;
      return {
        inputTokens: acc.inputTokens + (result.usage.inputTokens || 0),
        outputTokens: acc.outputTokens + (result.usage.outputTokens || 0),
        totalTokens: acc.totalTokens + (result.usage.totalTokens || 0),
      };
    },
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  );
}

export function createGenerateRouter(options: GenerateRouterOptions): Router {
  const router = Router();

  router.post("/", options.generateRateLimit, requireApiKey, async (req, res) => {
    const validated = validateGenerateRequest(req.body);
    if (!validated.ok) {
      sendError(res, validated.status, validated.code, validated.message);
      return;
    }

    const systemPrompt = getSystemPrompt(validated.level, validated.vocabCount);
    if (!systemPrompt) {
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "SYSTEM_PROMPT or SYSTEM_PROMPT_B64 environment variable is required."
      );
      return;
    }

    let ai;
    try {
      ai = createGeminiClient();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/generate] Gemini client init failed:", detail);
      sendError(
        res,
        500,
        "SERVER_MISCONFIGURED",
        "Server configuration is invalid."
      );
      return;
    }

    try {
      const generateOne = (passage: string, _index: number) =>
        generateOnePassage(ai, systemPrompt, passage, {
          model: validated.model,
          level: validated.level,
        });

      const results =
        options.processingMode === "parallel"
          ? await processBoundedParallel(
              validated.passages,
              generateOne,
              options.parallelLimit
            )
          : await processSequential(validated.passages, generateOne);

      const totalUsage = sumUsage(results);

      console.log(
        `[api] totalUsage: ${totalUsage.totalTokens} tokens (in: ${totalUsage.inputTokens}, out: ${totalUsage.outputTokens})`
      );

      res.json({ results, totalUsage });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      console.error("[api/generate] generation failed:", detail);
      sendError(
        res,
        502,
        "GENERATION_FAILED",
        "Gemini generation failed."
      );
    }
  });

  return router;
}
