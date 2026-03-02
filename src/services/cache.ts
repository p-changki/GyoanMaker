/**
 * 결과 캐시 유틸리티
 *
 * - Web Crypto SHA-256으로 passage 배열을 해시하여 캐시 키 생성
 * - sessionStorage에 결과 + 입력 + 생성시간 저장
 * - TTL 30분 초과 시 캐시 무효화
 */

import type { ApiResultItem } from "./api";

const CACHE_PREFIX = "gyoanmaker:result:";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30분

function fallbackHash(raw: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `${hex}${hex}`;
}

export interface CachedResult {
  results: ApiResultItem[];
  createdAt: string;
  version: number;
}

/**
 * passages 배열을 SHA-256 해시로 변환하여 짧은 캐시 키를 생성한다.
 */
export async function hashPassages(passages: string[]): Promise<string> {
  const raw = JSON.stringify(passages);
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    return fallbackHash(raw);
  }

  try {
    const data = new TextEncoder().encode(raw);
    const hashBuffer = await subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.slice(0, 16); // 앞 16자만 사용 (충돌 확률 극히 낮음)
  } catch {
    return fallbackHash(raw);
  }
}

/**
 * sessionStorage에서 캐시된 결과를 조회한다.
 * TTL 초과 시 null 반환 + 캐시 삭제.
 */
export function getCachedResult(hash: string): CachedResult | null {
  try {
    const key = `${CACHE_PREFIX}${hash}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<CachedResult> & {
      results?: unknown;
      createdAt?: unknown;
    };

    if (!Array.isArray(parsed.results)) {
      sessionStorage.removeItem(key);
      return null;
    }

    if (typeof parsed.createdAt !== "string") {
      sessionStorage.removeItem(key);
      return null;
    }

    // TTL 체크
    const age = Date.now() - new Date(parsed.createdAt).getTime();
    if (age > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      createdAt: parsed.createdAt,
      results: parsed.results as ApiResultItem[],
    };
  } catch {
    return null;
  }
}

/**
 * 결과를 sessionStorage에 캐시한다.
 */
export function setCachedResult(hash: string, results: ApiResultItem[]): void {
  try {
    const key = `${CACHE_PREFIX}${hash}`;
    const data: CachedResult = {
      version: 2,
      results,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // sessionStorage 용량 초과 등 무시
  }
}
