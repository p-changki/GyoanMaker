"use client";

import CopyButton from "@/components/CopyButton";

type RawResultStatus = "generating" | "completed" | "failed";

interface RawResultCardProps {
  passageId: string;
  outputText: string;
  status: RawResultStatus;
  onRegenerate: () => void;
  onRetry: () => void;
}

export default function RawResultCard({
  passageId,
  outputText,
  status,
  onRegenerate,
  onRetry,
}: RawResultCardProps) {
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
            onClick={onRegenerate}
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
            getText={() => outputText}
            label="복사"
            className="text-xs py-1.5 h-9 px-4 rounded-xl font-bold"
          />
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="prose prose-sm max-w-none prose-gray prose-headings:text-gray-900 prose-h3:text-lg prose-h3:font-black prose-strong:text-gray-800 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700">
          <div
            className="whitespace-pre-wrap text-[15px] leading-[1.85] text-gray-800 font-medium"
            dangerouslySetInnerHTML={{
              __html: formatMarkdownToHtml(outputText),
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 마크다운 → HTML 변환 (서드파티 의존성 없이)
 */
function formatMarkdownToHtml(text: string): string {
  return (
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // 헤더
      .replace(
        /^### (.+)$/gm,
        '<h3 class="text-lg font-black text-gray-900 mt-8 mb-4 first:mt-0">$1</h3>'
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 class="text-xl font-black text-gray-900 mt-8 mb-4">$1</h2>'
      )
      // 볼드
      .replace(
        /\*\*\[(\d+)\]\.\s*(.+?)\*\*/g,
        '<strong class="text-base text-blue-900">[$1]. $2</strong>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-900">$1</strong>')
      // 이탤릭 (리스트 마커 * 제외)
      .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>")
      // 구분선
      .replace(/^---$/gm, '<hr class="my-6 border-gray-200" />')
      // 리스트 아이템 (들여쓰기 포함)
      .replace(
        /^\*\s{3}\*\*(.+?)\*\*\s*(.*)$/gm,
        '<div class="pl-6 py-0.5 text-sm text-gray-600">• <strong class="text-gray-700">$1</strong> $2</div>'
      )
      .replace(
        /^(\d+)\.\s+(.+)$/gm,
        '<div class="py-1"><span class="text-blue-600 font-bold mr-1">$1.</span> $2</div>'
      )
      // 빈 줄을 줄바꿈으로
      .replace(/\n\n/g, '<div class="h-3"></div>')
      .replace(/\n/g, "<br />")
  );
}
