"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ActionBar from "@/components/ActionBar";
import CopyButton from "@/components/CopyButton";
import JsonModal from "@/components/JsonModal";
import ResultCard from "@/components/results/ResultCard";
import { MOCK_PASSAGE_RESULTS } from "@/lib/mockData";
import { formatAllPassagesText } from "@/lib/formatText";
import {
  PassageResult,
  InputMode,
  PassageInput,
  OutputOptionState,
  GenerationMode,
  ResultStatus,
} from "@/lib/types";

const SESSION_STORAGE_KEY = "gyoanmaker:input";

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
  status: ResultStatus;
  data: PassageResult;
}

export default function ResultsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [inputData, setInputData] = useState<SessionInputData | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    data: PassageResult | null;
  }>({
    isOpen: false,
    data: null,
  });

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

      const total = Math.min(20, parsed.passages.length);
      const initialResults: ResultItem[] = Array.from(
        { length: total },
        (_, i) => {
          const mockIndex = i % MOCK_PASSAGE_RESULTS.length;
          const mock = MOCK_PASSAGE_RESULTS[mockIndex];

          const status: ResultStatus = i === 2 ? "failed" : "completed";

          return {
            id: `P${String(i + 1).padStart(2, "0")}`,
            status,
            data: {
              ...mock,
              passage_id: `P${String(i + 1).padStart(2, "0")}`,
            },
          };
        }
      );
      setResults(initialResults);
    } catch (e) {
      console.error("Failed to parse session storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRegenerate = useCallback(async (index: number) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: "generating" };
      return next;
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setResults((prev) => {
      const next = [...prev];
      const currentItem = next[index];

      const currentMockIndex = MOCK_PASSAGE_RESULTS.findIndex(
        (m) => m.topic_sentence.en === currentItem.data.topic_sentence.en
      );
      const nextMockIndex =
        (currentMockIndex + 1) % MOCK_PASSAGE_RESULTS.length;
      const nextMock = MOCK_PASSAGE_RESULTS[nextMockIndex];

      next[index] = {
        ...currentItem,
        status: "completed",
        data: {
          ...nextMock,
          passage_id: currentItem.id,
        },
      };
      return next;
    });
  }, []);

  const handleRetry = useCallback(
    (index: number) => {
      handleRegenerate(index);
    },
    [handleRegenerate]
  );

  const handleShowJson = useCallback((data: PassageResult) => {
    setModalData({ isOpen: true, data });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

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
            getText={() => formatAllPassagesText(results.map((r) => r.data))}
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

        <div className="space-y-10">
          {results.map((item, index) => (
            <ResultCard
              key={item.id}
              result={item.data}
              status={item.status}
              onRegenerate={() => handleRegenerate(index)}
              onRetry={() => handleRetry(index)}
              onShowJson={() => handleShowJson(item.data)}
            />
          ))}
        </div>
      </main>

      <JsonModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, data: null })}
        data={modalData.data}
        title={`${modalData.data?.passage_id || ""} JSON 데이터`}
      />
    </div>
  );
}
