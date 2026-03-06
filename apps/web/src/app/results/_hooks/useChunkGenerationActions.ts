"use client";

import { Dispatch, MutableRefObject, SetStateAction, useCallback } from "react";
import {
  type GenerateChunkProgress,
  generatePassages,
  generatePassagesInChunks,
} from "@/services/api";
import {
  CHUNK_CONCURRENCY,
  FLASH_CHUNK_CONCURRENCY,
  FLASH_GENERATE_CHUNK_SIZE,
  type ResultItem,
  type ResultStatus,
  type SessionInputData,
} from "./chunkGeneration.types";
import { markIndexesFailed } from "./chunkGeneration.utils";

interface UseChunkGenerationActionsParams {
  inputData: SessionInputData | null;
  results: ResultItem[];
  applyChunkProgress: (targetIndexes: number[], progress: GenerateChunkProgress) => void;
  persistCachedResults: () => void;
  setResults: Dispatch<SetStateAction<ResultItem[]>>;
  setApiError: Dispatch<SetStateAction<string | null>>;
  setEtaSeconds: Dispatch<SetStateAction<number | null>>;
  setIsCancelling: Dispatch<SetStateAction<boolean>>;
  abortControllerRef: MutableRefObject<AbortController | null>;
  generationStartedAtRef: MutableRefObject<number | null>;
  isCancellingRef: MutableRefObject<boolean>;
  cachedResultMapRef: MutableRefObject<Map<number, string>>;
}

export function useChunkGenerationActions({
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
}: UseChunkGenerationActionsParams) {
  const handleRegenerate = useCallback(
    async (index: number) => {
      if (!inputData) return;

      cachedResultMapRef.current.delete(index);
      persistCachedResults();

      setResults((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: "generating",
          outputText: "",
          error: undefined,
        };
        return next;
      });

      try {
        const passage = inputData.passages[index];
        const response = await generatePassages([passage], undefined, {
          level: inputData.level,
          model: inputData.model,
        });
        const apiResult = response.results[0];

        setResults((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: "completed",
            outputText: apiResult?.outputText || "",
            error: undefined,
          };
          return next;
        });

        if (apiResult?.outputText) {
          cachedResultMapRef.current.set(index, apiResult.outputText);
          persistCachedResults();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "알 수 없는 오류";
        setResults((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: "failed",
            error: message,
          };
          return next;
        });
      }
    },
    [cachedResultMapRef, inputData, persistCachedResults, setResults]
  );

  const handleRetry = useCallback(
    (index: number) => {
      handleRegenerate(index);
    },
    [handleRegenerate]
  );

  const handleRetryFailedOnly = useCallback(async () => {
    const failedIndexes = results
      .filter((item) => item.status === "failed")
      .map((item) => item.index);

    if (!inputData || failedIndexes.length === 0) {
      return;
    }

    const retrySet = new Set(failedIndexes);
    const retryController = new AbortController();
    abortControllerRef.current = retryController;
    generationStartedAtRef.current = Date.now();
    setApiError(null);
    setEtaSeconds(null);
    setIsCancelling(false);
    isCancellingRef.current = false;

    setResults((prev) =>
      prev.map((item) => {
        if (!retrySet.has(item.index)) {
          return item;
        }

        return {
          ...item,
          status: "generating" as ResultStatus,
          error: undefined,
        };
      })
    );

    try {
      const retryIsFlash = inputData.model === "flash";
      const response = await generatePassagesInChunks(
        failedIndexes.map((index) => inputData.passages[index]),
        {
          signal: retryController.signal,
          chunkSize: retryIsFlash ? FLASH_GENERATE_CHUNK_SIZE : 1,
          concurrency: retryIsFlash ? FLASH_CHUNK_CONCURRENCY : CHUNK_CONCURRENCY,
          level: inputData.level,
          model: inputData.model,
          onChunkComplete: (progress) => {
            applyChunkProgress(failedIndexes, progress);

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

      setResults((prev) => markIndexesFailed(prev, retrySet, "결과를 찾을 수 없습니다.", false));

      if (response.failed.length > 0) {
        setApiError(`재시도 후에도 실패한 지문이 있습니다. (${response.failed.length}개)`);
      } else {
        setApiError(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      setApiError(message);
      setResults((prev) => markIndexesFailed(prev, retrySet, message, true));
    } finally {
      setEtaSeconds(null);
      setIsCancelling(false);
      isCancellingRef.current = false;
    }
  }, [
    abortControllerRef,
    applyChunkProgress,
    generationStartedAtRef,
    inputData,
    isCancellingRef,
    results,
    setApiError,
    setEtaSeconds,
    setIsCancelling,
    setResults,
  ]);

  const handleCancelGeneration = useCallback(() => {
    if (!abortControllerRef.current) {
      return;
    }

    isCancellingRef.current = true;
    setIsCancelling(true);
    abortControllerRef.current.abort();
  }, [abortControllerRef, isCancellingRef, setIsCancelling]);

  return {
    handleRegenerate,
    handleRetry,
    handleRetryFailedOnly,
    handleCancelGeneration,
  };
}
