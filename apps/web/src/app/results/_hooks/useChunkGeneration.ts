"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestNotificationPermission } from "@/lib/notifications";
import {
  type ApiResultItem,
  type GenerateChunkProgress,
  generatePassagesInChunks,
} from "@/services/api";
import { getCachedResult, hashPassages, setCachedResult } from "@/services/cache";
import {
  CHUNK_CONCURRENCY,
  FLASH_CHUNK_CONCURRENCY,
  FLASH_GENERATE_CHUNK_SIZE,
  INITIAL_GENERATE_CHUNK_SIZE,
  SESSION_STORAGE_KEY,
  type ResultItem,
  type SessionInputData,
  type ToastState,
} from "./chunkGeneration.types";
import {
  applySuccessAndFailure,
  buildInitialResults,
  computeChunkMetrics,
  markIndexesFailed,
  parseSessionInput,
} from "./chunkGeneration.utils";
import { useChunkGenerationActions } from "./useChunkGenerationActions";
import { useGenerationNotifications } from "./useGenerationNotifications";

export type { ResultItem, ResultStatus, SessionInputData } from "./chunkGeneration.types";

export function useChunkGeneration() {
  const [isLoading, setIsLoading] = useState(true);
  const [inputData, setInputData] = useState<SessionInputData | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const hasStartedRef = useRef(false);
  const hasNotifiedRef = useRef(false);
  const generationStartedAtRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancellingRef = useRef(false);
  const cacheHashRef = useRef<string | null>(null);
  const cachedResultMapRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useGenerationNotifications({
    results,
    hasStartedRef,
    hasNotifiedRef,
    setToast,
  });

  const persistCachedResults = useCallback(() => {
    const hash = cacheHashRef.current;
    if (!hash) return;

    const resultsForCache: ApiResultItem[] = Array.from(
      cachedResultMapRef.current.entries()
    )
      .map(([index, outputText]) => ({ index, outputText }))
      .sort((a, b) => a.index - b.index);

    setCachedResult(hash, resultsForCache);
  }, []);

  const applyChunkProgress = useCallback(
    (targetIndexes: number[], progress: GenerateChunkProgress) => {
      const successResults = progress.chunkResults
        .map((item) => {
          const targetIndex = targetIndexes[item.index];
          if (typeof targetIndex !== "number") {
            return null;
          }
          return { index: targetIndex, outputText: item.outputText };
        })
        .filter((item): item is ApiResultItem => item !== null);

      const failedIndexes = progress.failedIndices
        .map((chunkIndex) => targetIndexes[chunkIndex])
        .filter((index): index is number => typeof index === "number");

      if (successResults.length > 0) {
        successResults.forEach((item) => {
          cachedResultMapRef.current.set(item.index, item.outputText);
        });
        persistCachedResults();
      }

      if (successResults.length === 0 && failedIndexes.length === 0) {
        return;
      }

      const successMap = new Map(successResults.map((item) => [item.index, item.outputText]));
      const failedSet = new Set(failedIndexes);

      setResults((prev) =>
        applySuccessAndFailure(
          prev,
          successMap,
          failedSet,
          progress.errorMessage || "Generation failed."
        )
      );
    },
    [persistCachedResults]
  );

  useEffect(() => {
    let isStillMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const init = async () => {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const parsed = parseSessionInput(stored);

      if (!parsed) {
        if (stored) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
        setIsLoading(false);
        return;
      }

      setInputData(parsed);
      const total = Math.min(20, parsed.passages.length);

      const cachedMap = new Map<number, string>();
      try {
        const hash = await hashPassages(parsed.passages, parsed.vocabCount);
        cacheHashRef.current = hash;

        const cached = getCachedResult(hash);
        if (cached) {
          cached.results.forEach((item) => {
            if (
              item.index >= 0 &&
              item.index < total &&
              typeof item.outputText === "string" &&
              item.outputText.trim().length > 0
            ) {
              cachedMap.set(item.index, item.outputText);
            }
          });
        }
      } catch (error) {
        cacheHashRef.current = null;
        console.warn("[results] Cache hash failed, bypassing cache", error);
      }

      cachedResultMapRef.current = cachedMap;

      const { initialResults, pendingIndexes } = buildInitialResults(total, cachedMap);
      setResults(initialResults);
      setIsLoading(false);

      if (pendingIndexes.length === 0 || hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;
      generationStartedAtRef.current = Date.now();
      setEtaSeconds(null);
      setApiError(null);
      setIsCancelling(false);
      isCancellingRef.current = false;

      const pendingSet = new Set(pendingIndexes);
      const isFlashModel = parsed.model === "flash";
      const chunkSize = isFlashModel ? FLASH_GENERATE_CHUNK_SIZE : INITIAL_GENERATE_CHUNK_SIZE;
      const concurrency = isFlashModel ? FLASH_CHUNK_CONCURRENCY : CHUNK_CONCURRENCY;

      try {
        const response = await generatePassagesInChunks(
          pendingIndexes.map((index) => parsed.passages[index]),
          {
            signal: controller.signal,
            chunkSize,
            concurrency,
            level: parsed.level,
            model: parsed.model,
            vocabCount: parsed.vocabCount,
            onChunkComplete: (progress) => {
              if (!isStillMounted) {
                return;
              }

              applyChunkProgress(pendingIndexes, progress);

              const startedAt = generationStartedAtRef.current;
              if (startedAt && progress.processed > 0) {
                const elapsed = Date.now() - startedAt;
                const avgPerItem = elapsed / progress.processed;
                const remainingItems = Math.max(0, progress.total - progress.processed);
                setEtaSeconds(Math.max(0, Math.round((avgPerItem * remainingItems) / 1000)));
              }
            },
          }
        );

        if (!isStillMounted) {
          return;
        }

        setResults((prev) => markIndexesFailed(prev, pendingSet, "Results not found.", true));
        setApiError(
          response.failed.length > 0
            ? `Some passages failed. Please retry the failed items. (${response.failed.length} item(s))`
            : null
        );
        setEtaSeconds(null);
        setIsCancelling(false);
        isCancellingRef.current = false;
      } catch (error) {
        if (!isStillMounted) {
          return;
        }

        const requestError = error as Error;
        const aborted = requestError.name === "AbortError";
        const message = aborted
          ? isCancellingRef.current
            ? "Generation was cancelled."
            : "Request was cancelled."
          : requestError.message || "Unknown error";

        setApiError(message);
        setResults((prev) => markIndexesFailed(prev, pendingSet, message, true));
        setEtaSeconds(null);
        setIsCancelling(false);
        isCancellingRef.current = false;
      }
    };

    init();

    return () => {
      isStillMounted = false;
      controller.abort();
      hasStartedRef.current = false;
      abortControllerRef.current = null;
      generationStartedAtRef.current = null;
    };
  }, [applyChunkProgress]);

  const {
    handleRegenerate,
    handleRetry,
    handleRetryFailedOnly,
    handleCancelGeneration,
  } = useChunkGenerationActions({
    inputData,
    results,
    applyChunkProgress,
    persistCachedResults,
    setResults,
    setApiError,
    setEtaSeconds,
    setIsCancelling,
    abortControllerRef,
    generationStartedAtRef,
    isCancellingRef,
    cachedResultMapRef,
  });

  const metrics = useMemo(() => computeChunkMetrics(results, etaSeconds), [results, etaSeconds]);

  return {
    isLoading,
    inputData,
    results,
    apiError,
    etaSeconds,
    isCancelling,
    toast,
    setToast,
    metrics,
    handleRegenerate,
    handleRetry,
    handleRetryFailedOnly,
    handleCancelGeneration,
  };
}
