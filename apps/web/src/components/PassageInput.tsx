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
          지문 입력 (텍스트 블록)
        </label>
        <span
          className={`text-sm font-medium ${passageCount > 20 ? "text-red-500" : "text-blue-600"}`}
        >
          감지된 지문: {passageCount}개 {passageCount > 20 && "(최대 20개)"}
        </span>
      </div>
      <textarea
        id="passage-text"
        ref={textareaRef}
        className="w-full min-h-[300px] p-4 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-gray-400 overflow-hidden"
        placeholder="영어 지문을 입력하세요. 여러 지문은 --- 로 구분합니다."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />

      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          * <code className="bg-gray-100 px-1 rounded text-gray-700">---</code>{" "}
          로 구분하면 자동 분리됩니다. 권장 길이: 지문당 {RECOMMENDED_MIN_WORDS}
          ~{RECOMMENDED_MAX_WORDS} 단어
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
                P{String(stat.index + 1).padStart(2, "0")}: {stat.words}단어
                {stat.status === "short" && " (짧음)"}
                {stat.status === "long" && " (긴 지문)"}
                {stat.status === "over_limit" &&
                  ` (${MAX_WORDS_PER_PASSAGE}단어 초과)`}
              </span>
            ))}
          </div>
        )}

        {hasWarning && (
          <p className="text-xs text-amber-600">
            {RECOMMENDED_MIN_WORDS}~{RECOMMENDED_MAX_WORDS} 단어 범위의 지문에서
            가장 안정적인 교안이 생성됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
