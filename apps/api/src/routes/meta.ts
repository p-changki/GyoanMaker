import { Router, type RequestHandler } from "express";
import { requireAdminKey } from "../middleware/auth";
import { MODEL_NAME } from "../services/gemini";
import { getPromptMetadata } from "../services/prompt";

export function createMetaRouter(metaRateLimit: RequestHandler): Router {
  const router = Router();

  router.get("/", metaRateLimit, requireAdminKey, (_req, res) => {
    const meta = getPromptMetadata();
    res.json({
      model: MODEL_NAME,
      location: process.env.GOOGLE_CLOUD_LOCATION || "local",
      promptSource: meta?.source || "none",
      promptSha256: meta?.sha256 || "none",
      promptHead: meta?.head || "none",
    });
  });

  return router;
}
