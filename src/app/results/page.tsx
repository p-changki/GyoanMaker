"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ActionBar from "@/components/ActionBar";
import CopyButton from "@/components/CopyButton";
import RawResultCard from "@/components/results/RawResultCard";
import {
  type ApiResultItem,
  type GenerateChunkProgress,
  generatePassages,
  generatePassagesInChunks,
} from "@/services/api";
import {
  hashPassages,
  getCachedResult,
  setCachedResult,
} from "@/services/cache";
import {
  InputMode,
  PassageInput,
  OutputOptionState,
  GenerationMode,
} from "@/lib/types";
import { normalizeHandoutRawText } from "@/lib/normalizeHandoutRawText";

const SESSION_STORAGE_KEY = "gyoanmaker:input";
const INPUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const CHUNK_CONCURRENCY = 1;
const INITIAL_GENERATE_CHUNK_SIZE = 1;

function formatEta(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const remain = seconds % 60;

  if (mins <= 0) {
    return `${remain}초`;
  }

  return `${mins}분 ${remain}초`;
}

function stripTopicSummaryLanguageLabels(text: string): string {
  return normalizeHandoutRawText(text);
}

type ResultStatus = "pending" | "generating" | "completed" | "failed";

interface SessionInputData {
  inputMode: InputMode;
  textBlock?: string;
  cards?: PassageInput[];
  passages: string[];
  options: OutputOptionState;
  generationMode: GenerationMode;
  timestamp: string;
}

interface ResultItem {
  id: string;
  index: number;
  status: ResultStatus;
  outputText: string;
  error?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [inputData, setInputData] = useState<SessionInputData | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const hasStartedRef = useRef(false);
  const generationStartedAtRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancellingRef = useRef(false);
  const cacheHashRef = useRef<string | null>(null);
  const cachedResultMapRef = useRef<Map<number, string>>(new Map());

  const persistCachedResults = useCallback(() => {
    const hash = cacheHashRef.current;
    if (!hash) {
      return;
    }

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

      const successMap = new Map(
        successResults.map((item) => [item.index, item.outputText])
      );
      const failedSet = new Set(failedIndexes);

      setResults((prev) =>
        prev.map((item) => {
          const successText = successMap.get(item.index);
          if (typeof successText === "string") {
            return {
              ...item,
              status: "completed" as ResultStatus,
              outputText: successText,
              error: undefined,
            };
          }

          if (failedSet.has(item.index) && item.status !== "completed") {
            return {
              ...item,
              status: "failed" as ResultStatus,
              error: progress.errorMessage || "생성에 실패했습니다.",
            };
          }

          return item;
        })
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
      if (!stored) {
        setIsLoading(false);
        return;
      }

      let parsed: SessionInputData;
      try {
        const raw: unknown = JSON.parse(stored);
        if (typeof raw !== "object" || raw === null) {
          setIsLoading(false);
          return;
        }
        const rawObj = raw as Record<string, unknown>;

        if (!Array.isArray(rawObj.passages)) {
          setIsLoading(false);
          return;
        }
        const passages = (rawObj.passages as unknown[]).filter(
          (item): item is string => typeof item === "string"
        );
        if (passages.length === 0) {
          setIsLoading(false);
          return;
        }

        const timestamp =
          typeof rawObj.timestamp === "string" ? rawObj.timestamp : "";
        const payloadAge = Date.now() - new Date(timestamp).getTime();
        if (!Number.isFinite(payloadAge) || payloadAge > INPUT_MAX_AGE_MS) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        parsed = {
          inputMode: (rawObj.inputMode as SessionInputData["inputMode"]) ?? "text",
          passages,
          options: (rawObj.options as SessionInputData["options"]) ?? { copyBlock: false, pdf: false },
          generationMode: (rawObj.generationMode as SessionInputData["generationMode"]) ?? "basic",
          timestamp,
          textBlock: typeof rawObj.textBlock === "string" ? rawObj.textBlock : undefined,
          cards: Array.isArray(rawObj.cards) ? (rawObj.cards as SessionInputData["cards"]) : undefined,
        };
      } catch (error) {
        console.error("Failed to parse session storage", error);
        setIsLoading(false);
        return;
      }

      setInputData(parsed);
      const total = Math.min(20, parsed.passages.length);

      const cachedMap = new Map<number, string>();
      try {
        const hash = await hashPassages(parsed.passages);
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

      const pendingIndexes: number[] = [];
      const initialResults: ResultItem[] = Array.from(
        { length: total },
        (_, i) => {
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
        }
      );

      setResults(initialResults);
      setIsLoading(false);

      if (pendingIndexes.length === 0) {
        return;
      }

      if (hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;
      generationStartedAtRef.current = Date.now();
      setEtaSeconds(null);
      setApiError(null);
      setIsCancelling(false);
      isCancellingRef.current = false;

      const pendingSet = new Set(pendingIndexes);

      try {
        const response = await generatePassagesInChunks(
          pendingIndexes.map((index) => parsed.passages[index]),
          {
            signal: controller.signal,
            chunkSize: INITIAL_GENERATE_CHUNK_SIZE,
            concurrency: CHUNK_CONCURRENCY,
            onChunkComplete: (progress) => {
              if (!isStillMounted) {
                return;
              }

              applyChunkProgress(pendingIndexes, progress);

              const startedAt = generationStartedAtRef.current;
              if (startedAt && progress.processed > 0) {
                const elapsed = Date.now() - startedAt;
                const avgPerItem = elapsed / progress.processed;
                const remainingItems = Math.max(
                  0,
                  progress.total - progress.processed
                );
                setEtaSeconds(
                  Math.max(0, Math.round((avgPerItem * remainingItems) / 1000))
                );
              }
            },
          }
        );

        if (!isStillMounted) {
          return;
        }

        setResults((prev) =>
          prev.map((item) => {
            if (!pendingSet.has(item.index) || item.status !== "generating") {
              return item;
            }

            return {
              ...item,
              status: "failed" as ResultStatus,
              error: "결과를 찾을 수 없습니다.",
            };
          })
        );

        if (response.failed.length > 0) {
          setApiError(
            `일부 지문 생성에 실패했습니다. 실패한 항목만 재시도하세요. (${response.failed.length}개)`
          );
        } else {
          setApiError(null);
        }

        setEtaSeconds(null);
        setIsCancelling(false);
        isCancellingRef.current = false;
      } catch (error) {
        if (!isStillMounted) {
          return;
        }

        const requestError = error as Error;
        if (requestError.name === "AbortError") {
          const abortedMessage = isCancellingRef.current
            ? "생성이 취소되었습니다."
            : "요청이 취소되었습니다.";
          setApiError(abortedMessage);
          setResults((prev) =>
            prev.map((item) => {
              if (!pendingSet.has(item.index) || item.status === "completed") {
                return item;
              }

              return {
                ...item,
                status: "failed" as ResultStatus,
                error: abortedMessage,
              };
            })
          );
          setEtaSeconds(null);
          setIsCancelling(false);
          isCancellingRef.current = false;
          return;
        }

        const message = requestError.message || "알 수 없는 오류";
        setApiError(message);
        setResults((prev) =>
          prev.map((item) => {
            if (!pendingSet.has(item.index) || item.status === "completed") {
              return item;
            }

            return {
              ...item,
              status: "failed" as ResultStatus,
              error: message,
            };
          })
        );
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

  // 3) 개별 재생성
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
        const response = await generatePassages([passage]);
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
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류";
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
    [inputData, persistCachedResults]
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
      const response = await generatePassagesInChunks(
        failedIndexes.map((index) => inputData.passages[index]),
        {
          signal: retryController.signal,
          chunkSize: 1,
          concurrency: CHUNK_CONCURRENCY,
          onChunkComplete: (progress) => {
            applyChunkProgress(failedIndexes, progress);

            const startedAt = generationStartedAtRef.current;
            if (startedAt && progress.processed > 0) {
              const elapsed = Date.now() - startedAt;
              const avgPerItem = elapsed / progress.processed;
              const remainingItems = Math.max(
                0,
                progress.total - progress.processed
              );
              setEtaSeconds(
                Math.max(0, Math.round((avgPerItem * remainingItems) / 1000))
              );
            }
          },
        }
      );

      setResults((prev) =>
        prev.map((item) => {
          if (!retrySet.has(item.index) || item.status !== "generating") {
            return item;
          }

          return {
            ...item,
            status: "failed" as ResultStatus,
            error: "결과를 찾을 수 없습니다.",
          };
        })
      );

      if (response.failed.length > 0) {
        setApiError(
          `재시도 후에도 실패한 지문이 있습니다. (${response.failed.length}개)`
        );
      } else {
        setApiError(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setApiError(message);
      setResults((prev) =>
        prev.map((item) => {
          if (!retrySet.has(item.index) || item.status === "completed") {
            return item;
          }

          return {
            ...item,
            status: "failed" as ResultStatus,
            error: message,
          };
        })
      );
    } finally {
      setEtaSeconds(null);
      setIsCancelling(false);
      isCancellingRef.current = false;
    }
  }, [applyChunkProgress, inputData, results]);

  const handleCancelGeneration = useCallback(() => {
    if (!abortControllerRef.current) {
      return;
    }

    isCancellingRef.current = true;
    setIsCancelling(true);
    abortControllerRef.current.abort();
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // 데이터 없음
  if (!inputData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <p className="text-gray-600">입력된 데이터가 없습니다.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          처음으로 돌아가기
        </button>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <ActionBar
        completed={processed}
        total={total}
        onBack={() => router.push("/")}
      >
        <div className="flex items-center gap-2">
          {generating > 0 && (
            <button
              type="button"
              onClick={handleCancelGeneration}
              disabled={isCancelling}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-black text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 disabled:hover:bg-red-500 transition-all"
            >
              {isCancelling ? "중단 중..." : "생성 중단"}
            </button>
          )}
          <CopyButton
            getText={() =>
              results
                .filter((r) => r.status === "completed")
                .map(
                  (r) =>
                    `【${r.id}】\n${stripTopicSummaryLanguageLabels(r.outputText)}`
                )
                .join("\n\n---\n\n")
            }
            label="전체 복사"
            className="bg-white border-gray-200 hover:border-gray-300 shadow-sm rounded-xl font-bold text-xs h-9 px-4"
            disabled={completed === 0}
          />
          {failed > 0 && (
            <button
              type="button"
              onClick={handleRetryFailedOnly}
              disabled={generating > 0}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-black text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-60 disabled:hover:bg-amber-500 transition-all"
            >
              실패한 것만 재시도 ({failed})
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/compile")}
            className="inline-flex items-center justify-center px-6 py-2.5 text-[13px] font-black text-white bg-[#5E35B1] rounded-xl hover:bg-[#4527A0] transition-all shadow-xl shadow-purple-100 hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-right-4 duration-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <title>합본 교안 작성 아이콘</title>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            합본 교안 작성
          </button>
        </div>
      </ActionBar>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            생성된 교안
          </h1>
          <p className="text-gray-500 font-medium">
            입력하신 지문을 바탕으로 분석된 결과입니다.
          </p>
          {total > 0 && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              진행 {processed}/{total} ({progressPercent}%)
              {completed > 0 ? ` · 완료 ${completed}` : ""}
              {failed > 0 ? ` · 실패 ${failed}` : ""}
              {generating > 0 ? ` · 생성 중 ${generating}` : ""}
              {etaLabel && generating > 0 ? ` · 예상 ${etaLabel}` : ""}
            </p>
          )}
        </div>

        {apiError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            <strong>API 오류:</strong> {apiError}
          </div>
        )}

        {failedIds && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <strong>실패 항목:</strong> {failedIds}
          </div>
        )}

        <div className="space-y-10">
          {results.map((item, index) => (
            <RawResultCard
              key={item.id}
              passageId={item.id}
              outputText={item.outputText}
              status={item.status === "pending" ? "generating" : item.status}
              enableCollapse={results.length > 1}
              onRegenerate={() => handleRegenerate(index)}
              onRetry={() => handleRetry(index)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
