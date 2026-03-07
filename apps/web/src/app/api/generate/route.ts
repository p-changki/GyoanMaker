import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getQuotaStatus,
  incrementUsage,
  QuotaExceededError,
} from "@/lib/quota";
import { logUsage } from "@/lib/usageLog";
import type { QuotaModel } from "@gyoanmaker/shared/plans";

const MAX_WORDS_PER_PASSAGE = 400;
const MAX_TOTAL_WORDS = 5000;

function countWordsServer(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

const DEFAULT_PROXY_TIMEOUT_MS = 120000;
const LOCAL_PROXY_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_PROXY_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_PROXY_RATE_LIMIT_MAX = 20;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const proxyRateLimitStore = new Map<string, RateLimitEntry>();

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function getProxyRateLimitWindowMs(): number {
  return toPositiveInt(
    process.env.PROXY_RATE_LIMIT_WINDOW_MS,
    DEFAULT_PROXY_RATE_LIMIT_WINDOW_MS
  );
}

function getProxyRateLimitMax(): number {
  return toPositiveInt(
    process.env.PROXY_RATE_LIMIT_MAX,
    DEFAULT_PROXY_RATE_LIMIT_MAX
  );
}

function getClientAddress(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
    // Use last IP: actual client IP added by trusted proxies (Vercel/Cloud Run)
    const ips = forwardedFor
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    return ips[ips.length - 1] ?? "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

function enforceProxyRateLimit(req: NextRequest): number | null {
  const now = Date.now();
  const windowMs = getProxyRateLimitWindowMs();
  const max = getProxyRateLimitMax();
  const key = getClientAddress(req);
  const current = proxyRateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    proxyRateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (current.count >= max) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;

  if (proxyRateLimitStore.size > 2_000) {
    for (const [storedKey, entry] of proxyRateLimitStore) {
      if (entry.resetAt <= now) {
        proxyRateLimitStore.delete(storedKey);
      }
    }
  }

  return null;
}

function getRequestId(req: NextRequest): string {
  const fromHeader = req.headers.get("x-request-id")?.trim();
  return fromHeader || crypto.randomUUID();
}

function jsonWithRequestId(
  requestId: string,
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set("X-Request-ID", requestId);
  return response;
}

function getProxyTimeoutMs(baseUrl: string): number {
  const envTimeout = Number(process.env.CLOUDRUN_API_TIMEOUT_MS || "");
  if (Number.isFinite(envTimeout) && envTimeout >= 1000) {
    return Math.floor(envTimeout);
  }

  const isLocalTarget =
    baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
  return isLocalTarget ? LOCAL_PROXY_TIMEOUT_MS : DEFAULT_PROXY_TIMEOUT_MS;
}

/**
 * Vercel API Proxy
 *
 * To prevent exposing Cloud Run URL and API Key to the browser,
 * the request is proxied through Next.js server-side.
 */
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const baseUrl = process.env.CLOUDRUN_API_BASE_URL;
  const apiKey = process.env.CLOUDRUN_API_KEY;
  let timeoutMs = DEFAULT_PROXY_TIMEOUT_MS;

  const retryAfter = enforceProxyRateLimit(req);
  if (retryAfter !== null) {
    return jsonWithRequestId(
      requestId,
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please retry later.",
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  if (!baseUrl || !apiKey) {
    console.error(
      `[api/generate][${requestId}] Server is misconfigured: Missing baseUrl or apiKey.`
    );
    return jsonWithRequestId(
      requestId,
      {
        error: {
          code: "SERVER_MISCONFIGURED",
          message: "Server is not properly configured.",
        },
      },
      { status: 500 }
    );
  }

  try {
    timeoutMs = getProxyTimeoutMs(baseUrl);
    const startedAt = Date.now();
    const body = await req.json();
    const selectedModel: QuotaModel = body?.model === "flash" ? "flash" : "pro";

    // Server-side word count validation (last line of defense)
    const passages: unknown = body?.passages;
    if (Array.isArray(passages)) {
      let totalWords = 0;
      const overIndices: number[] = [];

      for (let i = 0; i < passages.length; i++) {
        if (typeof passages[i] === "string") {
          const wc = countWordsServer(passages[i] as string);
          totalWords += wc;
          if (wc > MAX_WORDS_PER_PASSAGE) {
            overIndices.push(i);
          }
        }
      }

      if (overIndices.length > 0) {
        const labels = overIndices
          .map((i) => `P${String(i + 1).padStart(2, "0")}`)
          .join(", ");
        return jsonWithRequestId(
          requestId,
          {
            error: {
              code: "PASSAGE_TOO_LONG",
              message: `${labels} passage(s) exceed ${MAX_WORDS_PER_PASSAGE} words.`,
            },
          },
          { status: 422 }
        );
      }

      if (totalWords > MAX_TOTAL_WORDS) {
        return jsonWithRequestId(
          requestId,
          {
            error: {
              code: "TOTAL_WORDS_EXCEEDED",
              message: `Total word count (${totalWords.toLocaleString()}) exceeds the maximum of ${MAX_TOTAL_WORDS.toLocaleString()} words.`,
            },
          },
          { status: 422 }
        );
      }
    }

    // Quota check (requires authenticated user)
    const session = await auth();
    const userEmail = session?.user?.email;
    const passageCount = Array.isArray(passages) ? passages.length : 1;

    if (userEmail) {
      const quota = await getQuotaStatus(userEmail);
      const modelQuota = selectedModel === "flash" ? quota.flash : quota.pro;

      if (modelQuota.remaining < passageCount) {
        return jsonWithRequestId(
          requestId,
          {
            error: {
              code: "QUOTA_EXCEEDED",
              message:
                selectedModel === "flash"
                  ? "Flash usage limit exceeded."
                  : "Pro usage limit exceeded.",
            },
          },
          { status: 429 }
        );
      }
    }

    const response = await fetch(`${baseUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
        "X-Request-ID": requestId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const duration = Date.now() - startedAt;
    console.log(
      `[api/generate][${requestId}] upstream status=${response.status} duration=${duration}ms timeout=${timeoutMs}ms`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return jsonWithRequestId(requestId, errorData, {
        status: response.status,
      });
    }

    const data = await response.json();

    // Increment quota + log token usage on success
    if (userEmail) {
      const totalUsage = data?.totalUsage;
      const successCount = Array.isArray(data?.results)
        ? data.results.length
        : passageCount;

      try {
        await Promise.all([
          incrementUsage(userEmail, selectedModel, successCount),
          totalUsage
            ? logUsage({
                email: userEmail,
                requestId,
                passageCount: successCount,
                model: selectedModel,
                level: body?.level ?? "advanced",
                inputTokens: totalUsage.inputTokens ?? 0,
                outputTokens: totalUsage.outputTokens ?? 0,
                totalTokens: totalUsage.totalTokens ?? 0,
              })
            : Promise.resolve(),
        ]);
      } catch (quotaErr) {
        if (quotaErr instanceof QuotaExceededError) {
          console.warn(
            `[api/generate][${requestId}] Post-success quota apply failed model=${quotaErr.model} needed=${quotaErr.needed} available=${quotaErr.available}`
          );
        }
        console.error(
          `[api/generate][${requestId}] Failed to increment quota/log usage: ${quotaErr instanceof Error ? quotaErr.message : quotaErr}`
        );
      }
    }

    return jsonWithRequestId(requestId, data);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonWithRequestId(
        requestId,
        {
          error: {
            code: "PROXY_TIMEOUT",
            message: `Backend request timed out after ${Math.floor(
              timeoutMs / 1000
            )}s.`,
          },
        },
        { status: 504 }
      );
    }

    const errName = error instanceof Error ? error.name : "UnknownError";
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[api/generate][${requestId}] Proxy error: [${errName}] ${errMsg}`
    );
    return jsonWithRequestId(
      requestId,
      {
        error: {
          code: "PROXY_ERROR",
          message: "Failed to connect to backend server.",
        },
      },
      { status: 502 }
    );
  }
}
