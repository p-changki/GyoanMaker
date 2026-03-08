export interface ApiResultItem {
  index: number;
  outputText: string;
}

export interface FailedGenerateItem {
  index: number;
  message: string;
  status?: number;
  code?: string;
}

export interface GenerateResponse {
  results: ApiResultItem[];
  failed: FailedGenerateItem[];
}

export interface GenerateChunkProgress {
  processed: number;
  total: number;
  chunkResults: ApiResultItem[];
  failedIndices: number[];
  errorMessage?: string;
  errorCode?: string;
  errorStatus?: number;
  chunkSize: number;
  fallbackToSingle: boolean;
}

interface GenerateInChunksOptions {
  signal?: AbortSignal;
  chunkSize?: number;
  concurrency?: number;
  level?: string;
  model?: string;
  onChunkComplete?: (progress: GenerateChunkProgress) => void;
}

export interface GenerateErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

interface ApiRequestErrorOptions {
  status?: number;
  code?: string;
  requestId?: string;
}

export class ApiRequestError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, options: ApiRequestErrorOptions = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}

const API_BASE_URL = "/api";
const IS_DEV = process.env.NODE_ENV !== "production";

function logChunk(message: string, payload: Record<string, unknown>): void {
  if (!IS_DEV) {
    return;
  }

  console.debug(`[generate/chunk] ${message}`, payload);
}

function createAbortError(): Error {
  const abortError = new Error("The operation was aborted.");
  abortError.name = "AbortError";
  return abortError;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function shouldFallbackToSingle(error: ApiRequestError): boolean {
  return error.status === 502 || error.code === "PROXY_TIMEOUT";
}

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
  signal?: AbortSignal,
  options?: { level?: string; model?: string }
): Promise<GenerateResponse> {
  const requestId = createRequestId();
  const body: Record<string, unknown> = { passages };
  if (options?.level) {
    body.level = options.level;
  }
  if (options?.model) {
    body.model = options.model;
  }
  const res = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const body = (await res
      .json()
      .catch(() => null)) as GenerateErrorResponse | null;
    const message =
      body?.error?.message || `API error: ${res.status} ${res.statusText}`;
    throw new ApiRequestError(message, {
      status: res.status,
      code: body?.error?.code,
      requestId: res.headers.get("x-request-id") || undefined,
    });
  }

  const data = (await res.json()) as Partial<GenerateResponse>;
  return {
    results: Array.isArray(data.results) ? data.results : [],
    failed: [],
  };
}

export async function generatePassagesInChunks(
  passages: string[],
  options: GenerateInChunksOptions = {}
): Promise<GenerateResponse> {
  const { signal, onChunkComplete, level, model } = options;
  const initialChunkSize = Math.max(1, Math.floor(options.chunkSize ?? 1));
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 1));
  const mergedResults: ApiResultItem[] = [];
  const failedResults: FailedGenerateItem[] = [];
  const total = passages.length;
  let processed = 0;

  if (total === 0) {
    return { results: [], failed: [] };
  }

  let cursor = 0;
  let nextChunkSize = initialChunkSize;
  let fallbackToSingle = initialChunkSize === 1;

  function takeChunk(): { indices: number[]; chunkPassages: string[] } | null {
    if (cursor >= passages.length) {
      return null;
    }

    const start = cursor;
    const end = Math.min(passages.length, start + nextChunkSize);
    cursor = end;

    const indices: number[] = [];
    for (let i = start; i < end; i += 1) {
      indices.push(i);
    }

    return {
      indices,
      chunkPassages: indices.map((index) => passages[index]),
    };
  }

  async function runWorker(workerId: number): Promise<void> {
    while (true) {
      if (signal?.aborted) {
        throw createAbortError();
      }

      const chunk = takeChunk();
      if (!chunk) {
        return;
      }

      const { indices, chunkPassages } = chunk;

      logChunk("start", {
        workerId,
        startIndex: indices[0],
        size: indices.length,
        processed,
        total,
        fallbackToSingle,
      });

      try {
        const response = await generatePassages(chunkPassages, signal, {
          level,
          model,
        });
        const chunkResults = response.results
          .map((result) => {
            const globalIndex = indices[result.index];
            if (typeof globalIndex !== "number") {
              return null;
            }

            return {
              index: globalIndex,
              outputText: result.outputText,
            };
          })
          .filter((item): item is ApiResultItem => item !== null);

        mergedResults.push(...chunkResults);
        processed += indices.length;

        onChunkComplete?.({
          processed,
          total,
          chunkResults,
          failedIndices: [],
          chunkSize: indices.length,
          fallbackToSingle,
        });

        logChunk("success", {
          workerId,
          startIndex: indices[0],
          size: indices.length,
          processed,
          total,
        });
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }

        const requestError =
          error instanceof ApiRequestError
            ? error
            : new ApiRequestError(
                error instanceof Error ? error.message : "알 수 없는 오류"
              );

        const isTimeoutFallback =
          !fallbackToSingle && shouldFallbackToSingle(requestError);
        if (isTimeoutFallback) {
          fallbackToSingle = true;
          nextChunkSize = 1;

          logChunk("fallback-to-single", {
            workerId,
            reasonCode: requestError.code,
            reasonStatus: requestError.status,
            processed,
            total,
          });
        }

        failedResults.push(
          ...indices.map((index) => ({
            index,
            message: requestError.message,
            status: requestError.status,
            code: requestError.code,
          }))
        );
        processed += indices.length;

        onChunkComplete?.({
          processed,
          total,
          chunkResults: [],
          failedIndices: [...indices],
          errorMessage: requestError.message,
          errorCode: requestError.code,
          errorStatus: requestError.status,
          chunkSize: indices.length,
          fallbackToSingle,
        });

        logChunk("failed", {
          workerId,
          startIndex: indices[0],
          size: indices.length,
          processed,
          total,
          status: requestError.status,
          code: requestError.code,
          message: requestError.message,
        });
      }
    }
  }

  const workerCount = Math.min(concurrency, total);
  await Promise.all(
    Array.from({ length: workerCount }, (_, workerId) =>
      runWorker(workerId + 1)
    )
  );

  mergedResults.sort((a, b) => a.index - b.index);
  failedResults.sort((a, b) => a.index - b.index);
  return { results: mergedResults, failed: failedResults };
}
