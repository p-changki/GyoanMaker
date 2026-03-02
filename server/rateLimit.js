function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function getClientIdentifier(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim().length > 0) {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return String(forwarded[0]).split(",")[0].trim();
  }

  if (typeof req.ip === "string" && req.ip.trim().length > 0) {
    return req.ip;
  }

  if (req.socket?.remoteAddress) {
    return req.socket.remoteAddress;
  }

  return "unknown";
}

function createRateLimitMiddleware(options = {}) {
  const windowMs = toPositiveInt(options.windowMs, 60_000);
  const max = toPositiveInt(options.max, 30);
  const scope = options.scope || "global";
  const buckets = new Map();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const clientId = getClientIdentifier(req);
    const key = `${scope}:${clientId}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please retry later.",
        },
      });
    }

    current.count += 1;

    if (buckets.size > 2_000) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) {
          buckets.delete(bucketKey);
        }
      }
    }

    return next();
  };
}

module.exports = {
  createRateLimitMiddleware,
};
