"use client";
import { PassageResult, ResultStatus } from "@/lib/types";
import { formatSectionText, formatPassageText } from "@/lib/formatText";
import CopyButton from "@/components/CopyButton";
import SectionHeader from "./SectionHeader";

interface ResultCardProps {
  result: PassageResult;
  status: ResultStatus;
  onRegenerate: () => void;
  onRetry: () => void;
  onShowJson: () => void;
}

export default function ResultCard({
  result,
  status,
  onRegenerate,
  onRetry,
  onShowJson,
}: ResultCardProps) {
  const isGenerating = status === "generating";
  const isFailed = status === "failed";

  if (isGenerating) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-blue-600">
              생성 중...
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-24 w-full bg-gray-50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="bg-white border-2 border-red-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {result.passage_id}
          </h2>
          <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100">
            생성 실패
          </span>
        </div>
        <div className="bg-red-50 rounded-lg p-4 mb-6 text-center">
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
            {result.passage_id}
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
            onClick={onShowJson}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors px-2"
          >
            JSON
          </button>
          <div className="h-4 w-px bg-gray-200" />
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
            getText={() => formatPassageText(result)}
            label="전체 복사"
            className="text-xs py-1.5 h-9 px-4 rounded-xl font-bold"
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-10">
        <section className="space-y-4">
          <SectionHeader
            title="문장별 구문 분석"
            onCopy={() => formatSectionText(result, "sentences")}
          />
          <div className="space-y-4">
            {result.sentences.map((s, i) => (
              <div
                key={s.en}
                className="group relative pl-6 border-l-2 border-gray-100 hover:border-blue-200 transition-colors"
              >
                <span className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-100 group-hover:border-blue-200 transition-colors flex items-center justify-center text-[8px] font-bold text-gray-400 group-hover:text-blue-500">
                  {i + 1}
                </span>
                <p className="text-[15px] text-gray-900 font-medium leading-relaxed">
                  {s.en}
                </p>
                <p className="text-sm text-gray-500 mt-1.5 font-medium">
                  → {s.ko}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="주제문"
            onCopy={() => formatSectionText(result, "topic_sentence")}
          />
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-2xl p-6 border border-blue-100/50 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>주제문 아이콘</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-extrabold text-blue-900 leading-relaxed">
                  {result.topic_sentence.en}
                </p>
                <p className="text-[15px] text-blue-700/80 mt-2 font-bold">
                  {result.topic_sentence.ko}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="요약"
            onCopy={() => formatSectionText(result, "summary")}
          />
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-black rounded uppercase tracking-tighter">
                  EN
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <p className="text-[15px] text-gray-800 leading-relaxed font-medium">
                {result.summary.en.join(" ")}
              </p>
            </div>
            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-gray-400 text-white text-[10px] font-black rounded uppercase tracking-tighter">
                  KO
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <p className="text-[15px] text-gray-600 leading-relaxed font-medium">
                {result.summary.ko.join(" ")}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="글의 흐름 4단 정리"
            onCopy={() => formatSectionText(result, "flow_4")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.flow_4.map((item, i) => (
              <div
                key={item.label}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-blue-100 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-gray-200 group-hover:text-blue-100 transition-colors">
                    0{i + 1}
                  </span>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            title="핵심 어휘"
            onCopy={() => formatSectionText(result, "core_vocab")}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {result.core_vocab.map((item) => (
              <div
                key={item.word}
                className="bg-gray-50/30 rounded-2xl p-5 border border-gray-100/60 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-lg font-black text-gray-900 tracking-tight">
                    {item.word}
                  </span>
                  <span className="text-sm text-blue-600 font-bold">
                    {item.meaning_ko}
                  </span>
                </div>
                <div className="space-y-3">
                  {item.synonyms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                        Synonyms
                      </span>
                      {item.synonyms.map((s) => (
                        <span
                          key={s.word}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-600 rounded-lg text-[10px] font-bold border border-gray-100 shadow-sm"
                        >
                          {s.word}
                          <span className="text-[8px] text-blue-500 opacity-60">
                            {s.level}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                  {item.antonyms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                        Antonyms
                      </span>
                      {item.antonyms.map((a) => (
                        <span
                          key={a.word}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-600 rounded-lg text-[10px] font-bold border border-gray-100 shadow-sm"
                        >
                          {a.word}
                          <span className="text-[8px] text-red-400 opacity-60">
                            {a.level}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
