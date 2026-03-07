"use client";

import { useRef, useEffect, useMemo } from "react";
import {
  splitTextBlockIntoPassages,
  countWords,
  getPassageLengthStatus,
  RECOMMENDED_MIN_WORDS,
  RECOMMENDED_MAX_WORDS,
  MAX_WORDS_PER_PASSAGE,
} from "@/lib/parsePassages";

interface PassageInputProps {
  value: string;
  onChange: (value: string) => void;
  passageCount: number;
}

export default function PassageInput({
  value,
  onChange,
  passageCount,
}: PassageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && typeof value === "string") {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(300, textarea.scrollHeight)}px`;
    }
  }, [value]);

  const passageStats = useMemo(() => {
    const passages = splitTextBlockIntoPassages(value);
    return passages.map((text, index) => ({
      index,
      words: countWords(text),
      status: getPassageLengthStatus(text),
    }));
  }, [value]);

  const hasWarning = passageStats.some((s) => s.status !== "ok");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="passage-text"
          className="text-sm font-medium text-gray-700"
        >
          Passage Input (Text Block)
        </label>
        <span
          className={`text-sm font-medium ${passageCount > 20 ? "text-red-500" : "text-blue-600"}`}
        >
          Detected: {passageCount} {passageCount > 20 && "(max 20)"}
        </span>
      </div>
      <textarea
        id="passage-text"
        ref={textareaRef}
        className="w-full min-h-[300px] p-4 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-gray-400 overflow-hidden"
        placeholder="Enter English passages. Separate multiple passages with ---"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />

      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          * Separate with <code className="bg-gray-100 px-1 rounded text-gray-700">---</code>{" "}
          for auto-splitting. Recommended: {RECOMMENDED_MIN_WORDS}
          ~{RECOMMENDED_MAX_WORDS} words per passage
        </p>

        {passageStats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {passageStats.map((stat) => (
              <span
                key={stat.index}
                className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                  stat.status === "ok"
                    ? "bg-gray-100 text-gray-600"
                    : stat.status === "over_limit"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                }`}
              >
                P{String(stat.index + 1).padStart(2, "0")}: {stat.words} words
                {stat.status === "short" && " (short)"}
                {stat.status === "long" && " (long)"}
                {stat.status === "over_limit" &&
                  ` (exceeds ${MAX_WORDS_PER_PASSAGE})`}
              </span>
            ))}
          </div>
        )}

        {hasWarning && (
          <p className="text-xs text-amber-600">
            Passages with {RECOMMENDED_MIN_WORDS}~{RECOMMENDED_MAX_WORDS} words
            produce the most reliable handouts.
          </p>
        )}
      </div>
    </div>
  );
}
