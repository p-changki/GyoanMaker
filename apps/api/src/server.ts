import crypto from "crypto";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import { createRateLimitMiddleware } from "./middleware/rateLimit";
import { createGenerateRouter } from "./routes/generate";
import { createMetaRouter } from "./routes/meta";
import { getSystemPrompt } from "./services/prompt";

dotenv.config({
  path: [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env.local"),
    path.resolve(process.cwd(), "../../.env"),
  ],
});

const app = express();
app.set("trust proxy", true);

const PORT = Number(process.env.PORT || 4000);
const PROCESSING_MODE =
  process.env.PROCESSING_MODE === "parallel" ? "parallel" : "sequential";
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

function toPositiveInt(value: unknown, fallback: number): number {
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

function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGIN_SET.has(origin);
}

function getHeaderValue(value: string | string[] | undefined): string {
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

app.use((req: Request, res: Response, next) => {
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

app.use(
  "/generate",
  createGenerateRouter({
    generateRateLimit,
    processingMode: PROCESSING_MODE,
    parallelLimit: PARALLEL_LIMIT,
  })
);
app.use("/meta", createMetaRouter(metaRateLimit));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found.");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api] listening on http://0.0.0.0:${PORT}`);
  console.log(`[api] SYSTEM_PROMPT: ${getSystemPrompt() ? "loaded" : "NOT SET"}`);
  console.log(`[api] mode: ${PROCESSING_MODE}`);
  console.log(`[api] allowed origins: ${Array.from(ALLOWED_ORIGIN_SET).join(", ")}`);
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
