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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function generatePassages(
  passages: string[]
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passages }),
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
