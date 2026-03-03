import { NextRequest, NextResponse } from "next/server";

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
    // 마지막 IP를 사용: Vercel/Cloud Run 등 신뢰된 프록시가 추가한 실제 클라이언트 IP
    const ips = forwardedFor.split(",").map((ip) => ip.trim()).filter(Boolean);
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
 * 브라우저에서 Cloud Run URL과 API Key가 노출되는 것을 방지하기 위해
 * Next.js 서버 사이드에서 요청을 대신 전달한다.
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
    console.error(`[api/generate][${requestId}] Proxy error: [${errName}] ${errMsg}`);
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
