"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_PASSAGE_RESULTS } from "@/lib/mockData";
import { formatPassageText } from "@/lib/formatText";
import {
  PassageResult,
  InputMode,
  PassageInput,
  OutputOptionState,
  ContentLevel,
  ModelTier,
} from "@gyoanmaker/shared/types";

const SESSION_STORAGE_KEY = "gyoanmaker:input";
const INPUT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

interface SessionInputData {
  inputMode: InputMode;
  textBlock?: string;
  cards?: PassageInput[];
  passages: string[];
  options: OutputOptionState;
  level: ContentLevel;
  model: ModelTier;
  timestamp: string;
}

export default function PreviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [inputData, setInputData] = useState<SessionInputData | null>(null);
  const [results, setResults] = useState<PassageResult[]>([]);

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

      const payloadAge = Date.now() - new Date(parsed.timestamp).getTime();
      if (!Number.isFinite(payloadAge) || payloadAge > INPUT_MAX_AGE_MS) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      setInputData(parsed);

      const total = Math.min(20, parsed.passages.length);
      const initialResults: PassageResult[] = Array.from(
        { length: total },
        (_, i) => {
          const mockIndex = i % MOCK_PASSAGE_RESULTS.length;
          const mock = MOCK_PASSAGE_RESULTS[mockIndex];

          return {
            ...mock,
            passage_id: `P${String(i + 1).padStart(2, "0")}`,
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

  const handlePrint = () => {
    window.print();
  };

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
        <p className="text-gray-600">No input data found.</p>
        <button
          type="button"
          onClick={() => router.push("/generate")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f6]">
      <div className="no-print sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              type="button"
              onClick={() => router.push("/results")}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all group"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-gray-900 tracking-tight">
                Print Preview
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Print Preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="py-12 px-4">
        <div className="max-w-[210mm] mx-auto space-y-12">
          {results.map((result) => (
            <div
              key={result.passage_id}
              className="print-page rounded-sm shadow-2xl shadow-gray-300/50"
            >
              <pre className="whitespace-pre-wrap font-sans text-[11pt] leading-[1.7] text-gray-900">
                {formatPassageText(result)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
