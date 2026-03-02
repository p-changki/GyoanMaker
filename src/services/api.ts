export interface ApiResultItem {
  index: number;
  outputText: string;
}

export interface GenerateResponse {
  results: ApiResultItem[];
}

export interface GenerateChunkProgress {
  processed: number;
  total: number;
  chunkResults: ApiResultItem[];
}

interface GenerateInChunksOptions {
  signal?: AbortSignal;
  chunkSize?: number;
  onChunkComplete?: (progress: GenerateChunkProgress) => void;
}

export interface GenerateErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

const API_BASE_URL = "/api";

function createRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export async function generatePassages(
  passages: string[],
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const requestId = createRequestId();
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
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

export async function generatePassagesInChunks(
  passages: string[],
  options: GenerateInChunksOptions = {}
): Promise<GenerateResponse> {
  const { signal, onChunkComplete } = options;
  const chunkSize = Math.max(1, Math.floor(options.chunkSize ?? 1));
  const mergedResults: ApiResultItem[] = [];
  const total = passages.length;
  let processed = 0;

  for (let start = 0; start < passages.length; start += chunkSize) {
    if (signal?.aborted) {
      const abortError = new Error("The operation was aborted.");
      abortError.name = "AbortError";
      throw abortError;
    }

    const chunkPassages = passages.slice(start, start + chunkSize);
    const response = await generatePassages(chunkPassages, signal);
    const chunkResults = response.results.map((result) => ({
      index: start + result.index,
      outputText: result.outputText,
    }));

    mergedResults.push(...chunkResults);
    processed += chunkPassages.length;
    onChunkComplete?.({ processed, total, chunkResults });
  }

  mergedResults.sort((a, b) => a.index - b.index);
  return { results: mergedResults };
}
