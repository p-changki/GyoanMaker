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

export interface CachedResult {
  passages: string[];
  results: ApiResultItem[];
  createdAt: string;
}

/**
 * passages 배열을 SHA-256 해시로 변환하여 짧은 캐시 키를 생성한다.
 */
export async function hashPassages(passages: string[]): Promise<string> {
  const raw = JSON.stringify(passages);
  const data = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, 16); // 앞 16자만 사용 (충돌 확률 극히 낮음)
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

    const parsed: CachedResult = JSON.parse(stored);

    // TTL 체크
    const age = Date.now() - new Date(parsed.createdAt).getTime();
    if (age > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * 결과를 sessionStorage에 캐시한다.
 */
export function setCachedResult(
  hash: string,
  passages: string[],
  results: ApiResultItem[]
): void {
  try {
    const key = `${CACHE_PREFIX}${hash}`;
    const data: CachedResult = {
      passages,
      results,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // sessionStorage 용량 초과 등 무시
  }
}
