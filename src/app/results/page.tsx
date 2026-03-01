"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ActionBar from "@/components/ActionBar";
import CopyButton from "@/components/CopyButton";
import RawResultCard from "@/components/results/RawResultCard";
import { generatePassages, ApiResultItem } from "@/services/api";
import {
  InputMode,
  PassageInput,
  OutputOptionState,
  GenerationMode,
} from "@/lib/types";

const SESSION_STORAGE_KEY = "gyoanmaker:input";

type ResultStatus = "pending" | "generating" | "completed" | "failed";

interface SessionInputData {
  inputMode: InputMode;
  textBlock: string;
  cards: PassageInput[];
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
  const hasStartedRef = useRef(false);

  // 1) sessionStorage에서 데이터 읽기
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed.passages || !Array.isArray(parsed.passages)) {
        setIsLoading(false);
        return;
      }
      setInputData(parsed);

      // 초기 상태: 모두 pending
      const total = Math.min(20, parsed.passages.length);
      const initialResults: ResultItem[] = Array.from(
        { length: total },
        (_, i) => ({
          id: `P${String(i + 1).padStart(2, "0")}`,
          index: i,
          status: "pending" as ResultStatus,
          outputText: "",
        })
      );
      setResults(initialResults);
    } catch (e) {
      console.error("Failed to parse session storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2) inputData가 설정되면 API 호출
  useEffect(() => {
    if (!inputData || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const callApi = async () => {
      // 모두 generating 상태로 전환
      setResults((prev) =>
        prev.map((r) => ({ ...r, status: "generating" as ResultStatus }))
      );

      try {
        const response = await generatePassages(inputData.passages);

        setResults((prev) =>
          prev.map((r) => {
            const apiResult = response.results.find(
              (ar: ApiResultItem) => ar.index === r.index
            );
            if (apiResult) {
              return {
                ...r,
                status: "completed" as ResultStatus,
                outputText: apiResult.outputText,
              };
            }
            return {
              ...r,
              status: "failed" as ResultStatus,
              error: "결과를 찾을 수 없습니다.",
            };
          })
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "알 수 없는 오류";
        setApiError(message);
        setResults((prev) =>
          prev.map((r) => ({
            ...r,
            status: "failed" as ResultStatus,
            error: message,
          }))
        );
      }
    };

    callApi();
  }, [inputData]);

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
  const showPdf = inputData.options?.pdf === true;

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <ActionBar
        completed={completed}
        total={total}
        onBack={() => router.push("/")}
      >
        <div className="flex items-center gap-2">
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
              onClick={() => router.push("/preview")}
              className="inline-flex items-center justify-center px-5 py-2 text-xs font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              PDF 다운로드
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
