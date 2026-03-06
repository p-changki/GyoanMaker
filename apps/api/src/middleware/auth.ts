import crypto from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

function parseKeys(multiEnvName: string, singleEnvName: string): string[] {
  const multiKeys = (process.env[multiEnvName] ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  const singleKey = (process.env[singleEnvName] ?? "").trim();
  if (singleKey) {
    multiKeys.push(singleKey);
  }

  return [...new Set(multiKeys)];
}

const API_KEYS = parseKeys("API_KEYS", "API_KEY");
const ADMIN_KEYS = parseKeys("ADMIN_KEYS", "ADMIN_KEY");

function normalizeHeaderValue(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]).trim();
  }

  return "";
}

function toDigest(value: string): Buffer {
  return crypto.createHash("sha256").update(value).digest();
}

function timingSafeMatch(input: string, secret: string): boolean {
  const inputDigest = toDigest(input);
  const secretDigest = toDigest(secret);
  return crypto.timingSafeEqual(inputDigest, secretDigest);
}

function matchAnyKey(input: string, keys: string[]): boolean {
  return keys.some((key) => timingSafeMatch(input, key));
}

function maskToken(token: string): string {
  if (!token) {
    return "missing";
  }

  if (token.length <= 6) {
    return "******";
  }

  return `${token.slice(0, 3)}***${token.slice(-2)}`;
}

function handleMisconfiguredKeySet(res: Response, keyName: string): void {
  res.status(500).json({
    error: {
      code: "SERVER_MISCONFIGURED",
      message: `${keyName} is not configured.`,
    },
  });
}

export const requireApiKey: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (API_KEYS.length === 0) {
    handleMisconfiguredKeySet(res, "API_KEYS/API_KEY");
    return;
  }

  const apiKey = normalizeHeaderValue(req.headers["x-api-key"]);

  if (!apiKey || !matchAnyKey(apiKey, API_KEYS)) {
    console.warn("[auth] unauthorized API key attempt", {
      requestId: req.requestId ?? "n/a",
      path: req.originalUrl,
      providedKey: maskToken(apiKey),
    });
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing API key.",
      },
    });
    return;
  }

  next();
};

export const requireAdminKey: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (ADMIN_KEYS.length === 0) {
    handleMisconfiguredKeySet(res, "ADMIN_KEYS/ADMIN_KEY");
    return;
  }

  const adminKey = normalizeHeaderValue(req.headers["x-admin-key"]);

  if (!adminKey || !matchAnyKey(adminKey, ADMIN_KEYS)) {
    console.warn("[auth] unauthorized admin key attempt", {
      requestId: req.requestId ?? "n/a",
      path: req.originalUrl,
      providedKey: maskToken(adminKey),
    });
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing admin key.",
      },
    });
    return;
  }

  next();
};
