export interface ApiResultItem {
  index: number;
  outputText: string;
}

export interface GenerateResponse {
  results: ApiResultItem[];
}

export interface GenerateErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Vercel Proxy를 통한 호출로 변경 (보안)
// /api/generate 경로는 Next.js Route Handler(Proxy)에서 처리함
const API_BASE_URL = "/api";

export async function generatePassages(
  passages: string[],
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passages }),
    signal,
  });

  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => null)) as GenerateErrorResponse | null;
    const message =
      body?.error?.message || `API error: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  return (await res.json()) as GenerateResponse;
}
