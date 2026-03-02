"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ActionBar from "@/components/ActionBar";
import CopyButton from "@/components/CopyButton";
import RawResultCard from "@/components/results/RawResultCard";
import { generatePassages, generatePassagesInChunks } from "@/services/api";
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

const SESSION_STORAGE_KEY = "gyoanmaker:input";
const INPUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const INITIAL_GENERATE_CHUNK_SIZE = Math.max(
  1,
  Math.floor(Number(process.env.NEXT_PUBLIC_INITIAL_GENERATE_CHUNK_SIZE || 1))
);

function formatEta(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const remain = seconds % 60;

  if (mins <= 0) {
    return `${remain}초`;
  }

  return `${mins}분 ${remain}초`;
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
        parsed = JSON.parse(stored);
        if (!parsed.passages || !Array.isArray(parsed.passages)) {
          setIsLoading(false);
          return;
        }

        const payloadAge = Date.now() - new Date(parsed.timestamp).getTime();
        if (!Number.isFinite(payloadAge) || payloadAge > INPUT_MAX_AGE_MS) {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to parse session storage", e);
        setIsLoading(false);
        return;
      }

      setInputData(parsed);
      const total = Math.min(20, parsed.passages.length);

      let hash: string | null = null;
      let cached: ReturnType<typeof getCachedResult> = null;
      try {
        hash = await hashPassages(parsed.passages);
        cached = getCachedResult(hash);
      } catch (error) {
        console.warn("[results] Cache hash failed, bypassing cache", error);
      }

      if (cached) {
        // 캐시 히트 → API 호출 없이 즉시 렌더링
        setResults(
          Array.from({ length: total }, (_, i) => ({
            id: `P${String(i + 1).padStart(2, "0")}`,
            index: i,
            status: "completed" as ResultStatus,
            outputText:
              cached.results.find((r) => r.index === i)?.outputText || "",
          }))
        );
        setIsLoading(false);
        return;
      }

      // 캐시 미스 + 중복 호출 가드
      if (hasStartedRef.current) {
        setIsLoading(false);
        return;
      }
      hasStartedRef.current = true;
      generationStartedAtRef.current = Date.now();
      setEtaSeconds(null);
      setApiError(null);
      setIsCancelling(false);
      isCancellingRef.current = false;

      setResults(
        Array.from({ length: total }, (_, i) => ({
          id: `P${String(i + 1).padStart(2, "0")}`,
          index: i,
          status: "generating" as ResultStatus,
          outputText: "",
        }))
      );
      setIsLoading(false);

      try {
        const response = await generatePassagesInChunks(parsed.passages, {
          signal: controller.signal,
          chunkSize: INITIAL_GENERATE_CHUNK_SIZE,
          onChunkComplete: ({ chunkResults, processed, total: chunkTotal }) => {
            if (!isStillMounted) return;

            setResults((prev) =>
              prev.map((r) => {
                const apiResult = chunkResults.find(
                  (ar) => ar.index === r.index
                );
                if (!apiResult) {
                  return r;
                }

                return {
                  ...r,
                  status: "completed" as ResultStatus,
                  outputText: apiResult.outputText,
                  error: undefined,
                };
              })
            );

            const startedAt = generationStartedAtRef.current;
            if (startedAt && processed > 0) {
              const elapsed = Date.now() - startedAt;
              const avgPerItem = elapsed / processed;
              const remainingItems = Math.max(0, chunkTotal - processed);
              setEtaSeconds(
                Math.max(0, Math.round((avgPerItem * remainingItems) / 1000))
              );
            }
          },
        });

        // 캐시 저장
        if (hash) {
          setCachedResult(hash, response.results);
        }

        if (!isStillMounted) return;

        setResults((prev) =>
          prev.map((r) => {
            const apiResult = response.results.find(
              (ar) => ar.index === r.index
            );
            if (apiResult) {
              return {
                ...r,
                status: "completed" as ResultStatus,
                outputText: apiResult.outputText,
                error: undefined,
              };
            }

            if (r.status === "completed") {
              return r;
            }

            return {
              ...r,
              status: "failed" as ResultStatus,
              error: "결과를 찾을 수 없습니다.",
            };
          })
        );
        setEtaSeconds(null);
        setIsCancelling(false);
        isCancellingRef.current = false;
      } catch (err: unknown) {
        if (!isStillMounted) return;
        const error = err as Error;

        if (error.name === "AbortError") {
          const abortedMessage = isCancellingRef.current
            ? "생성이 취소되었습니다."
            : "요청이 취소되었습니다.";
          setApiError(abortedMessage);
          setResults((prev) =>
            prev.map((r) => {
              if (r.status === "completed") {
                return r;
              }

              return {
                ...r,
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

        const message = error.message || "알 수 없는 오류";
        setApiError(message);
        setResults((prev) =>
          prev.map((r) => {
            if (r.status === "completed") {
              return r;
            }

            return {
              ...r,
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
  }, []);

  // 3) 개별 재생성
  const handleRegenerate = useCallback(
    async (index: number) => {
      if (!inputData) return;

      setResults((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: "generating", outputText: "" };
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
          };
          return next;
        });
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
    [inputData]
  );

  const handleRetry = useCallback(
    (index: number) => {
      handleRegenerate(index);
    },
    [handleRegenerate]
  );

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
  const generating = results.filter((r) => r.status === "generating").length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const showPdf = inputData.options?.pdf === true;
  const etaLabel = etaSeconds !== null ? formatEta(etaSeconds) : null;

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <ActionBar
        completed={completed}
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
                .map((r) => `【${r.id}】\n${r.outputText}`)
                .join("\n\n---\n\n")
            }
            label="전체 복사"
            className="bg-white border-gray-200 hover:border-gray-300 shadow-sm rounded-xl font-bold text-xs h-9 px-4"
            disabled={completed === 0}
          />
          {showPdf && (
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
          )}
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
              진행 {completed}/{total} ({progressPercent}%)
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

        <div className="space-y-10">
          {results.map((item, index) => (
            <RawResultCard
              key={item.id}
              passageId={item.id}
              outputText={item.outputText}
              status={item.status === "pending" ? "generating" : item.status}
              onRegenerate={() => handleRegenerate(index)}
              onRetry={() => handleRetry(index)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
