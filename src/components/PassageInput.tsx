"use client";

import { useRef, useEffect } from "react";

interface PassageInputProps {
  value: string;
  onChange: (value: string) => void;
  passageCount: number;
}

export default function PassageInput({ value, onChange, passageCount }: PassageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && typeof value === "string") {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(300, textarea.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor="passage-text" className="text-sm font-medium text-gray-700">
          지문 입력 (텍스트 블록)
        </label>
        <span className={`text-sm font-medium ${passageCount > 20 ? 'text-red-500' : 'text-blue-600'}`}>
          감지된 지문: {passageCount}개 {passageCount > 20 && '(최대 20개)'}
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
      <p className="text-xs text-gray-500">
        * 지문 사이를 <code className="bg-gray-100 px-1 rounded text-gray-700">---</code> 로 구분하여 입력하면 자동으로 분리됩니다.
      </p>
    </div>
  );
}
