"use client";

import { useMemo } from "react";
import {
  countWords,
  getPassageLengthStatus,
  MAX_WORDS_PER_PASSAGE,
} from "@/lib/parsePassages";

interface PassageCardProps {
  index: number;
  text: string;
  onChange: (text: string) => void;
  onRemove: () => void;
}

export default function PassageCard({
  index,
  text,
  onChange,
  onRemove,
}: PassageCardProps) {
  const label = `P${String(index + 1).padStart(2, "0")}`;

  const words = useMemo(() => countWords(text), [text]);
  const status = useMemo(() => getPassageLengthStatus(text), [text]);
  const hasText = text.trim().length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {label}
          </span>
          {hasText && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                status === "ok"
                  ? "text-gray-500 bg-gray-100"
                  : status === "over_limit"
                    ? "text-red-600 bg-red-50"
                    : "text-amber-600 bg-amber-50"
              }`}
            >
              {words} 단어
              {status === "short" && " (짧음)"}
              {status === "long" && " (김)"}
              {status === "over_limit" &&
                ` (${MAX_WORDS_PER_PASSAGE} 초과)`}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500 transition-colors p-1"
          aria-label="Remove passage"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
      <textarea
        className="w-full h-32 p-3 text-sm border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-gray-300"
        placeholder="영어 지문을 입력하세요."
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
