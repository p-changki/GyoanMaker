import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getQuotaStatus,
  incrementUsage,
  QuotaExceededError,
} from "@/lib/quota";
import { logUsage } from "@/lib/usageLog";
import { expirePlanIfNeeded } from "@/lib/subscription";
import { getUserStatus } from "@/lib/users";
import type { QuotaModel } from "@gyoanmaker/shared/plans";

// Vercel serverless function max duration (seconds). Must match CLOUDRUN_API_TIMEOUT_MS.
export const maxDuration = 300;

const DEFAULT_PROXY_TIMEOUT_MS = 280_000;
const LOCAL_PROXY_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_PROXY_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_PROXY_RATE_LIMIT_MAX = 20;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface VocabBankPassageInput {
  passageId: string;
  sentences: string[];
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
  // Prefer Cloudflare's immutable client IP header (cannot be spoofed)
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim().length > 0) {
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

function parseVocabBankBody(raw: unknown):
  | {
      ok: true;
      passages: VocabBankPassageInput[];
      model: QuotaModel;
    }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
    } {
  if (typeof raw !== "object" || raw === null) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_BODY",
      message: "Request body must be an object.",
    };
  }

  const body = raw as { passages?: unknown; model?: unknown };

  if (body.model !== "flash" && body.model !== "pro") {
    return {
      ok: false,
      status: 400,
      code: "INVALID_BODY",
      message: 'model must be "flash" or "pro".',
    };
  }
  const model: QuotaModel = body.model;
  const passagesRaw = body.passages;

  if (!Array.isArray(passagesRaw) || passagesRaw.length < 1 || passagesRaw.length > 20) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_BODY",
      message: "passages must be an array with 1 to 20 items.",
    };
  }

  const passages: VocabBankPassageInput[] = [];
  for (let i = 0; i < passagesRaw.length; i += 1) {
    const candidate = passagesRaw[i];
    if (typeof candidate !== "object" || candidate === null) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_BODY",
        message: `passages[${i}] must be an object.`,
      };
    }

    const record = candidate as { passageId?: unknown; sentences?: unknown };
    const passageId =
      typeof record.passageId === "string" ? record.passageId.trim() : "";
    if (!passageId) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_BODY",
        message: `passages[${i}].passageId is required.`,
      };
    }

    if (!Array.isArray(record.sentences) || record.sentences.length < 1 || record.sentences.length > 50) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_BODY",
        message: `passages[${i}].sentences must contain 1 to 50 items.`,
      };
    }

    const sentences: string[] = [];
    for (let j = 0; j < record.sentences.length; j += 1) {
      const sentence = record.sentences[j];
      const normalized = typeof sentence === "string" ? sentence.trim() : "";
      if (!normalized) {
        return {
          ok: false,
          status: 400,
          code: "INVALID_BODY",
          message: `passages[${i}].sentences[${j}] must be a non-empty string.`,
        };
      }
      sentences.push(normalized);
    }

    passages.push({ passageId, sentences });
  }

  return {
    ok: true,
    passages,
    model,
  };
}

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
      `[api/vocab-bank][${requestId}] Server is misconfigured: Missing baseUrl or apiKey.`
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

  const session = await auth();
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return jsonWithRequestId(
      requestId,
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      },
      { status: 401 }
    );
  }

  const userStatus = await getUserStatus(userEmail);
  if (userStatus !== "approved") {
    return jsonWithRequestId(
      requestId,
      { error: { code: "FORBIDDEN", message: "Account not approved." } },
      { status: 403 }
    );
  }

  try {
    timeoutMs = getProxyTimeoutMs(baseUrl);
    const bodyRaw = await req.json();
    const parsed = parseVocabBankBody(bodyRaw);

    if (!parsed.ok) {
      return jsonWithRequestId(
        requestId,
        {
          error: {
            code: parsed.code,
            message: parsed.message,
          },
        },
        { status: parsed.status }
      );
    }

    const passageCount = parsed.passages.length;
    await expirePlanIfNeeded(userEmail);
    const quota = await getQuotaStatus(userEmail);
    const modelQuota = parsed.model === "flash" ? quota.flash : quota.pro;

    if (modelQuota.remaining < passageCount) {
      return jsonWithRequestId(
        requestId,
        {
          error: {
            code: "QUOTA_EXCEEDED",
            message:
              parsed.model === "flash"
                ? "Flash usage limit exceeded."
                : "Pro usage limit exceeded.",
          },
        },
        { status: 429 }
      );
    }

    const upstreamBody = {
      passages: parsed.passages,
      model: parsed.model,
    };

    // SSE stream with heartbeat — keeps Cloudflare connection alive beyond 100s
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            // stream already closed
          }
        }, 5000);

        const cleanup = () => clearInterval(heartbeatInterval);

        const sendData = (payload: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
          controller.close();
        };

        try {
          const response = await fetch(`${baseUrl}/vocab-bank`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": apiKey,
              "X-Request-ID": requestId,
            },
            body: JSON.stringify(upstreamBody),
            signal: AbortSignal.timeout(timeoutMs),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            cleanup();
            sendData({ __status: response.status, ...errorData });
            return;
          }

          const data = await response.json();
          const totalUsage = data?.totalUsage;

          try {
            await incrementUsage(userEmail, parsed.model, passageCount);
            if (totalUsage) {
              logUsage({
                email: userEmail,
                requestId,
                passageCount,
                model: parsed.model,
                level: "vocab-bank",
                inputTokens: totalUsage.inputTokens ?? 0,
                outputTokens: totalUsage.outputTokens ?? 0,
                totalTokens: totalUsage.totalTokens ?? 0,
              }).catch((err) =>
                console.error(`[api/vocab-bank][${requestId}] logUsage failed:`, err)
              );
            }
          } catch (quotaErr) {
            if (quotaErr instanceof QuotaExceededError) {
              console.warn(
                `[api/vocab-bank][${requestId}] Post-success quota apply failed model=${quotaErr.model} needed=${quotaErr.needed} available=${quotaErr.available}`
              );
            }
            console.error(
              `[api/vocab-bank][${requestId}] Failed to increment quota/log usage: ${quotaErr instanceof Error ? quotaErr.message : quotaErr}`
            );
          }

          sendData(data);
          cleanup();
        } catch (error) {
          cleanup();
          const isTimeout =
            error instanceof Error && error.name === "TimeoutError";
          const errName = error instanceof Error ? error.name : "UnknownError";
          const errMsg = error instanceof Error ? error.message : String(error);
          if (!isTimeout) {
            console.error(
              `[api/vocab-bank][${requestId}] Proxy error: [${errName}] ${errMsg}`
            );
          }
          sendData({
            __status: isTimeout ? 504 : 502,
            error: {
              code: isTimeout ? "PROXY_TIMEOUT" : "PROXY_ERROR",
              message: isTimeout
                ? `Backend request timed out after ${Math.floor(timeoutMs / 1000)}s.`
                : "Failed to connect to backend server.",
            },
          });
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    const errName = error instanceof Error ? error.name : "UnknownError";
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[api/vocab-bank][${requestId}] Unexpected error: [${errName}] ${errMsg}`
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
