/**
 * 인증 미들웨어
 *
 * - API_KEY: /generate 등 일반 API 보호
 * - ADMIN_KEY: /meta 등 관리자 API 보호
 */

const crypto = require("crypto");

function parseKeys(multiEnvName, singleEnvName) {
  const multiKeys = (process.env[multiEnvName] || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  const singleKey = (process.env[singleEnvName] || "").trim();
  if (singleKey) {
    multiKeys.push(singleKey);
  }

  return [...new Set(multiKeys)];
}

const API_KEYS = parseKeys("API_KEYS", "API_KEY");
const ADMIN_KEYS = parseKeys("ADMIN_KEYS", "ADMIN_KEY");

function normalizeHeaderValue(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && value.length > 0) {
    return String(value[0]).trim();
  }

  return "";
}

function toDigest(value) {
  return crypto.createHash("sha256").update(value).digest();
}

function timingSafeMatch(input, secret) {
  const inputDigest = toDigest(input);
  const secretDigest = toDigest(secret);
  return crypto.timingSafeEqual(inputDigest, secretDigest);
}

function matchAnyKey(input, keys) {
  return keys.some((key) => timingSafeMatch(input, key));
}

function maskToken(token) {
  if (!token) {
    return "missing";
  }

  if (token.length <= 6) {
    return "******";
  }

  return `${token.slice(0, 3)}***${token.slice(-2)}`;
}

function handleMisconfiguredKeySet(res, keyName) {
  return res.status(500).json({
    error: {
      code: "SERVER_MISCONFIGURED",
      message: `${keyName} is not configured.`,
    },
  });
}

/**
 * 일반 API용 API Key 검증 미들웨어
 */
function requireApiKey(req, res, next) {
  if (API_KEYS.length === 0) {
    return handleMisconfiguredKeySet(res, "API_KEYS/API_KEY");
  }

  const apiKey = normalizeHeaderValue(req.headers["x-api-key"]);

  if (!apiKey || !matchAnyKey(apiKey, API_KEYS)) {
    console.warn("[auth] unauthorized API key attempt", {
      requestId: req.requestId || "n/a",
      path: req.originalUrl,
      providedKey: maskToken(apiKey),
    });
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing API key.",
      },
    });
  }
  next();
}

/**
 * 관리자용 Admin Key 검증 미들웨어
 */
function requireAdminKey(req, res, next) {
  if (ADMIN_KEYS.length === 0) {
    return handleMisconfiguredKeySet(res, "ADMIN_KEYS/ADMIN_KEY");
  }

  const adminKey = normalizeHeaderValue(req.headers["x-admin-key"]);

  if (!adminKey || !matchAnyKey(adminKey, ADMIN_KEYS)) {
    console.warn("[auth] unauthorized admin key attempt", {
      requestId: req.requestId || "n/a",
      path: req.originalUrl,
      providedKey: maskToken(adminKey),
    });
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing admin key.",
      },
    });
  }
  next();
}

module.exports = {
  requireApiKey,
  requireAdminKey,
};
