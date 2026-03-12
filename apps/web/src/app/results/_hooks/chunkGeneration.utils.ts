import {
  INPUT_MAX_AGE_MS,
  type ChunkMetrics,
  formatEta,
  type ResultItem,
  type SessionInputData,
} from "./chunkGeneration.types";

export function parseSessionInput(stored: string | null): SessionInputData | null {
  if (!stored) {
    return null;
  }

  try {
    const raw: unknown = JSON.parse(stored);
    if (typeof raw !== "object" || raw === null) {
      return null;
    }

    const rawObj = raw as Record<string, unknown>;
    if (!Array.isArray(rawObj.passages)) {
      return null;
    }

    const passages = (rawObj.passages as unknown[]).filter(
      (item): item is string => typeof item === "string"
    );
    if (passages.length === 0) {
      return null;
    }

    const timestamp = typeof rawObj.timestamp === "string" ? rawObj.timestamp : "";
    const payloadAge = Date.now() - new Date(timestamp).getTime();

    if (!Number.isFinite(payloadAge) || payloadAge > INPUT_MAX_AGE_MS) {
      return null;
    }

    return {
      inputMode: (rawObj.inputMode as SessionInputData["inputMode"]) ?? "text",
      passages,
      options: (rawObj.options as SessionInputData["options"]) ?? {
        copyBlock: false,
        pdf: false,
      },
      level: (rawObj.level as SessionInputData["level"]) ?? "advanced",
      model: (rawObj.model as SessionInputData["model"]) ?? "pro",
      vocabCount: (rawObj.vocabCount as SessionInputData["vocabCount"]) ?? "standard",
      timestamp,
      textBlock: typeof rawObj.textBlock === "string" ? rawObj.textBlock : undefined,
      cards: Array.isArray(rawObj.cards)
        ? (rawObj.cards as SessionInputData["cards"])
        : undefined,
    };
  } catch (error) {
    console.error("Failed to parse session storage", error);
    return null;
  }
}

export function buildInitialResults(
  total: number,
  cachedMap: Map<number, string>
): { initialResults: ResultItem[]; pendingIndexes: number[] } {
  const pendingIndexes: number[] = [];

  const initialResults: ResultItem[] = Array.from({ length: total }, (_, i) => {
    const cachedOutput = cachedMap.get(i) || "";
    const status = cachedOutput ? "completed" : "generating";

    if (!cachedOutput) {
      pendingIndexes.push(i);
    }

    return {
      id: `P${String(i + 1).padStart(2, "0")}`,
      index: i,
      status,
      outputText: cachedOutput,
    };
  });

  return { initialResults, pendingIndexes };
}

export function markIndexesFailed(
  prev: ResultItem[],
  indexes: Set<number>,
  errorMessage: string,
  keepCompleted = true
): ResultItem[] {
  return prev.map((item) => {
    if (!indexes.has(item.index) || (keepCompleted && item.status === "completed")) {
      return item;
    }

    return {
      ...item,
      status: "failed",
      error: errorMessage,
    };
  });
}

export function applySuccessAndFailure(
  prev: ResultItem[],
  successMap: Map<number, string>,
  failedSet: Set<number>,
  errorMessage: string
): ResultItem[] {
  return prev.map((item) => {
    const successText = successMap.get(item.index);
    if (typeof successText === "string") {
      return {
        ...item,
        status: "completed",
        outputText: successText,
        error: undefined,
      };
    }

    if (failedSet.has(item.index) && item.status !== "completed") {
      return {
        ...item,
        status: "failed",
        error: errorMessage,
      };
    }

    return item;
  });
}

export function computeChunkMetrics(
  results: ResultItem[],
  etaSeconds: number | null
): ChunkMetrics {
  const total = results.length;
  const completed = results.filter((r) => r.status === "completed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const generating = results.filter((r) => r.status === "generating").length;
  const processed = completed + failed;
  const progressPercent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const etaLabel = etaSeconds !== null ? formatEta(etaSeconds) : null;
  const failedIds = results
    .filter((r) => r.status === "failed")
    .map((r) => r.id)
    .join(", ");

  return {
    total,
    completed,
    failed,
    generating,
    processed,
    progressPercent,
    etaLabel,
    failedIds,
  };
}
