"use client";

import { type ReactNode, useMemo, useRef, useState } from "react";
import CopyButton from "@/components/CopyButton";
import { normalizeHandoutRawText } from "@/lib/normalizeHandoutRawText";

const COLLAPSE_LINE_THRESHOLD = 30;

type RawResultStatus = "generating" | "completed" | "failed";

interface RawResultCardProps {
  passageId: string;
  outputText: string;
  status: RawResultStatus;
  enableCollapse: boolean;
  onRegenerate: () => void;
  onRetry: () => void;
}

export default function RawResultCard({
  passageId,
  outputText,
  status,
  enableCollapse,
  onRegenerate,
  onRetry,
}: RawResultCardProps) {
  const displayText = useMemo(
    () => normalizeHandoutRawText(outputText),
    [outputText]
  );

  const formattedBlocks = useMemo(
    () => renderFormattedBlocks(displayText),
    [displayText]
  );

  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Reset collapsed when status changes to "generating" (render-time state sync)
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    if (enableCollapse && status === "generating") {
      setIsCollapsed(true);
    }
  }

  // Derive expandability from line count (pure computation)
  const isExpandable = useMemo(() => {
    if (!enableCollapse) return false;
    const lineCount = displayText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0).length;
    return lineCount > COLLAPSE_LINE_THRESHOLD;
  }, [displayText, enableCollapse]);

  // enableCollapse=false → shouldClamp=false (no setState needed)
  const shouldClamp = enableCollapse && isExpandable && isCollapsed;

  const handleRegenerateClick = () => {
    setIsCollapsed(true);
    onRegenerate();
  };

  if (status === "generating") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-blue-600">
              생성 중...
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-32 w-full bg-gray-50 rounded-lg mt-4" />
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-white border-2 border-red-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-black text-sm">
              {passageId}
            </div>
            <h2 className="text-base font-bold text-gray-900">
              지문 분석 결과
            </h2>
          </div>
          <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">
            생성 실패
          </span>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-sm text-red-800 mb-3">
            지문 분석 중 오류가 발생했습니다.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden card-hover-effect">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-100">
            {passageId}
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-gray-900">
              지문 분석 결과
            </h2>
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Completed
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRegenerateClick}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="재생성"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>재생성</title>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
          <CopyButton
            getText={() => displayText}
            label="복사"
            className="text-xs py-1.5 h-9 px-4 rounded-xl font-bold"
          />
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="prose prose-sm max-w-none prose-gray prose-headings:text-gray-900 prose-h3:text-lg prose-h3:font-black prose-strong:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700">
          <div>
            <div className="relative">
              <div
                ref={contentRef}
                className={`whitespace-pre-wrap text-[15px] leading-[1.85] text-gray-800 font-medium ${
                  shouldClamp ? "max-h-[700px] overflow-hidden" : ""
                }`}
              >
                {formattedBlocks}
              </div>
            </div>

            {enableCollapse && isExpandable && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsCollapsed((prev) => !prev)}
                  className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
                >
                  {isCollapsed ? "더 보기" : "접기"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderInlineText(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+?\*\*|\*[^*\s][^*]*?[^*\s]\*)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const full = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }

    if (full.startsWith("**") && full.endsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${tokenIndex}`} className="text-gray-900">
          {full.slice(2, -2)}
        </strong>
      );
      tokenIndex += 1;
    } else if (full.startsWith("*") && full.endsWith("*")) {
      nodes.push(
        <em key={`${keyPrefix}-i-${tokenIndex}`}>{full.slice(1, -1)}</em>
      );
      tokenIndex += 1;
    }

    cursor = start + full.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function renderFormattedBlocks(text: string): ReactNode[] {
  const lines = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const nodes: ReactNode[] = [];
  let inVocabSection = false;
  let relatedMode: "syn" | "ant" | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trimEnd();
    const key = `line-${index}`;
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      nodes.push(<div key={key} className="h-3" />);
      continue;
    }

    if (/^\[[^\]]+\]$/.test(trimmed)) {
      inVocabSection = trimmed.includes("핵심 어휘");
      relatedMode = null;
      nodes.push(
        <div key={key} className="inline-flex items-center py-1">
          <span className="bg-[#5E35B1] text-white text-[11px] font-bold px-2.5 py-1 rounded-md tracking-wide">
            {trimmed.replace(/^\[|\]$/g, "")}
          </span>
        </div>
      );
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3
          key={key}
          className="text-lg font-black text-gray-900 mt-8 mb-4 first:mt-0"
        >
          {renderInlineText(line.slice(4), key)}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key} className="text-xl font-black text-gray-900 mt-8 mb-4">
          {renderInlineText(line.slice(3), key)}
        </h2>
      );
      continue;
    }

    if (trimmed === "---") {
      nodes.push(<hr key={key} className="my-6 border-gray-200" />);
      continue;
    }

    if (inVocabSection && trimmed === "유의어") {
      relatedMode = "syn";
      nodes.push(
        <div key={key} className="pt-2 pl-1">
          <span className="text-[12px] font-bold text-[#374151]">유의어</span>
        </div>
      );
      continue;
    }

    if (inVocabSection && trimmed === "반의어") {
      relatedMode = "ant";
      nodes.push(
        <div key={key} className="pt-2 pl-1">
          <span className="text-[12px] font-bold text-[#374151]">반의어</span>
        </div>
      );
      continue;
    }

    const nestedBulletMatch = line.match(/^\*\s{3}\*\*(.+?)\*\*\s*(.*)$/);
    if (nestedBulletMatch) {
      const [, title, rest] = nestedBulletMatch;
      nodes.push(
        <div key={key} className="pl-6 py-0.5 text-sm text-gray-600">
          • <strong className="text-gray-700">{title}</strong>
          {rest ? ` ${rest}` : ""}
        </div>
      );
      continue;
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const [, number, content] = numberedMatch;
      relatedMode = null;
      const vocabHead =
        inVocabSection && !trimmed.includes("핵심 어휘") ? (
          <div
            key={key}
            className="mt-2 px-3 py-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]"
          >
            <span className="text-[#5E35B1] font-black mr-1">{number}.</span>
            <span className="text-[#111827] font-bold">{content}</span>
          </div>
        ) : (
          <div key={key} className="py-1">
            <span className="text-blue-600 font-bold mr-1">{number}.</span>
            {renderInlineText(content, key)}
          </div>
        );

      nodes.push(vocabHead);
      continue;
    }

    if (inVocabSection && relatedMode) {
      nodes.push(
        <div key={key} className="pl-5 py-0.5 text-[12px] text-[#1F2937]">
          {renderInlineText(line, key)}
        </div>
      );
      continue;
    }

    nodes.push(<div key={key}>{renderInlineText(line, key)}</div>);
  }

  return nodes;
}
