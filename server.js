require("dotenv").config({ path: [".env.local", ".env"] });

const crypto = require("crypto");
const cors = require("cors");
const express = require("express");
const {
  MODEL_NAME,
  createGeminiClient,
  generateOnePassage,
} = require("./server/gemini");
const {
  processSequential,
  processBoundedParallel,
} = require("./server/processor");
const { createRateLimitMiddleware } = require("./server/rateLimit");
const { validateGenerateRequest } = require("./server/validation");
const { getSystemPrompt, getPromptMetadata } = require("./server/prompt");
const { requireApiKey, requireAdminKey } = require("./server/auth");

const app = express();
app.set("trust proxy", true);

const PORT = Number(process.env.PORT || 4000);
const PROCESSING_MODE = process.env.PROCESSING_MODE || "sequential";
const PARALLEL_LIMIT = Number(process.env.PARALLEL_LIMIT || 3);

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const ALLOWED_ORIGIN_SET = new Set(
  (process.env.CORS_ALLOW_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

const GENERATE_RATE_LIMIT_WINDOW_MS = toPositiveInt(
  process.env.GENERATE_RATE_LIMIT_WINDOW_MS,
  60_000
);
const GENERATE_RATE_LIMIT_MAX = toPositiveInt(
  process.env.GENERATE_RATE_LIMIT_MAX,
  20
);
const META_RATE_LIMIT_WINDOW_MS = toPositiveInt(
  process.env.META_RATE_LIMIT_WINDOW_MS,
  60_000
);
const META_RATE_LIMIT_MAX = toPositiveInt(process.env.META_RATE_LIMIT_MAX, 5);

const generateRateLimit = createRateLimitMiddleware({
  windowMs: GENERATE_RATE_LIMIT_WINDOW_MS,
  max: GENERATE_RATE_LIMIT_MAX,
  scope: "generate",
});

const metaRateLimit = createRateLimitMiddleware({
  windowMs: META_RATE_LIMIT_WINDOW_MS,
  max: META_RATE_LIMIT_MAX,
  scope: "meta",
});

function sendError(res, status, code, message) {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGIN_SET.has(origin);
}

function getHeaderValue(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]).trim();
  }

  return "";
}

app.use((req, res, next) => {
  const incomingRequestId = getHeaderValue(req.headers["x-request-id"]);
  req.requestId = incomingRequestId || crypto.randomUUID();
  res.setHeader("X-Request-ID", req.requestId);

  const startedAt = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(
      `[api] [${req.requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, isAllowedOrigin(origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "X-API-KEY",
      "X-ADMIN-KEY",
      "X-Request-ID",
    ],
    maxAge: 600,
  })
);

app.use((req, res, next) => {
  const origin = getHeaderValue(req.headers.origin);
  if (!origin) {
    next();
    return;
  }

  if (isAllowedOrigin(origin)) {
    next();
    return;
  }

  console.warn("[cors] blocked origin", {
    requestId: req.requestId,
    origin,
    path: req.originalUrl,
  });

  sendError(res, 403, "ORIGIN_NOT_ALLOWED", "Origin not allowed.");
});

app.use(express.json({ limit: "1mb" }));

app.get("/meta", metaRateLimit, requireAdminKey, (req, res) => {
  const meta = getPromptMetadata();
  return res.json({
    model: MODEL_NAME,
    location: process.env.GOOGLE_CLOUD_LOCATION || "local",
    promptSource: meta?.source || "none",
    promptSha256: meta?.sha256 || "none",
    promptHead: meta?.head || "none",
  });
});

app.get("/health", (_req, res) => {
  return res.json({ ok: true });
});

app.post("/generate", generateRateLimit, requireApiKey, async (req, res) => {
  const validated = validateGenerateRequest(req.body);
  if (!validated.ok) {
    return sendError(res, validated.status, validated.code, validated.message);
  }

  const systemPrompt = getSystemPrompt(validated.level);
  if (!systemPrompt) {
    return sendError(
      res,
      500,
      "SERVER_MISCONFIGURED",
      "SYSTEM_PROMPT or SYSTEM_PROMPT_B64 environment variable is required."
    );
  }

  let ai;
  try {
    ai = createGeminiClient();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return sendError(res, 500, "SERVER_MISCONFIGURED", detail);
  }

  try {
    const generateOne = (passage) =>
      generateOnePassage(ai, systemPrompt, passage, { model: validated.model, level: validated.level });

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
  console.log(
    `[api] allowed origins: ${Array.from(ALLOWED_ORIGIN_SET).join(", ")}`
  );
  console.log(
    `[api] rate limit /generate: ${GENERATE_RATE_LIMIT_MAX}/${Math.floor(
      GENERATE_RATE_LIMIT_WINDOW_MS / 1000
    )}s`
  );
  console.log(
    `[api] rate limit /meta: ${META_RATE_LIMIT_MAX}/${Math.floor(
      META_RATE_LIMIT_WINDOW_MS / 1000
    )}s`
  );
});
