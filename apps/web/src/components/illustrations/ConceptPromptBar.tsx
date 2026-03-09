"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";

interface ConceptPromptBarProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  credits: number;
  referenceImageUrl?: string | null;
  onReferenceImageSelect?: (file: File) => void;
  onReferenceImageClear?: () => void;
  isUploadingReferenceImage?: boolean;
  dailyUsage?: { used: number; limit: number } | null;
}

export default function ConceptPromptBar({
  value,
  onChange,
  onGenerate,
  isGenerating,
  credits,
  referenceImageUrl,
  onReferenceImageSelect,
  onReferenceImageClear,
  isUploadingReferenceImage = false,
  dailyUsage,
}: ConceptPromptBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isGenerating) {
        onGenerate();
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onReferenceImageSelect) {
      onReferenceImageSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {!referenceImageUrl ? (
            <button
              type="button"
              disabled={isUploadingReferenceImage}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {isUploadingReferenceImage ? "업로드 중..." : "화풍 참조 이미지 추가"}
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-1">
              <Image
                src={referenceImageUrl}
                alt="Reference style"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-xs font-medium text-gray-600">참조 이미지 적용됨</span>
              <button
                type="button"
                disabled={isUploadingReferenceImage}
                onClick={onReferenceImageClear}
                className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500 hover:bg-white disabled:opacity-50"
              >
                제거
              </button>
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400">png/jpeg/webp, 최대 5MB</p>
      </div>

      <div className="flex items-start gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="스타일 테스트용 장면을 묘사하세요. 예: 미래 도시에서 로봇이 학생들에게 수업하는 장면 (실제 지문 일러스트는 자동 생성됩니다)"
          maxLength={500}
          rows={1}
          className="min-h-[44px] flex-1 resize-none rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5E35B1]/30"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !value.trim()}
          className="shrink-0 rounded-xl bg-[#5E35B1] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4527A0] disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              생성 중...
            </span>
          ) : (
            "스타일 테스트 생성"
          )}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <p className="text-xs text-gray-400">
          Enter로 생성 · Shift+Enter로 줄바꿈 · 이 프롬프트는 테스트용이며 실제 지문 일러스트에는 사용되지 않습니다
        </p>
        <p className="text-xs font-semibold text-[#5E35B1]">
          테스트 생성 무료{dailyUsage ? ` (${dailyUsage.used}/${dailyUsage.limit}회)` : ""} · 잔여 크레딧 {credits.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
