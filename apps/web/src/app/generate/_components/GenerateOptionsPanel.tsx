"use client";

import { ContentLevel, ModelTier, OutputOptionState } from "@gyoanmaker/shared/types";

interface GenerateOptionsPanelProps {
  contentLevel: ContentLevel;
  modelTier: ModelTier;
  options: OutputOptionState;
  onContentLevelChange: (value: ContentLevel) => void;
  onModelTierChange: (value: ModelTier) => void;
  onOptionsChange: (value: OutputOptionState) => void;
  onGuideOpen: () => void;
}

export default function GenerateOptionsPanel({
  contentLevel,
  modelTier,
  options,
  onContentLevelChange,
  onModelTierChange,
  onOptionsChange,
  onGuideOpen,
}: GenerateOptionsPanelProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Difficulty icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">난이도</h3>
          </div>
          <div className="space-y-3">
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-emerald-300 ${
                contentLevel === "advanced"
                  ? "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="contentLevel"
                checked={contentLevel === "advanced"}
                onChange={() => onContentLevelChange("advanced")}
                className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">심화</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  상위권 학생용, B2~C1 고급 어휘
                </span>
              </div>
            </label>
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-emerald-300 ${
                contentLevel === "basic"
                  ? "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="contentLevel"
                checked={contentLevel === "basic"}
                onChange={() => onContentLevelChange("basic")}
                className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">기본</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  중위권 학생용, A2~B1 기초 어휘
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Generation mode icon</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">생성 모드</h3>
          </div>
          <div className="space-y-3">
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-blue-300 ${
                modelTier === "pro"
                  ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="modelTier"
                checked={modelTier === "pro"}
                onChange={() => onModelTierChange("pro")}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">정밀 모드</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">최고 품질 · 느림 (30~60초/지문)</span>
              </div>
            </label>
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-blue-300 ${
                modelTier === "flash"
                  ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="modelTier"
                checked={modelTier === "flash"}
                onChange={() => onModelTierChange("flash")}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">속도 모드</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">빠른 결과 · 빠름 (5~10초/지문)</span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Output options icon</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">출력 옵션</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start p-3.5 rounded-xl border border-violet-400 bg-violet-50/40 ring-1 ring-violet-400/30">
              <div className="w-4 h-4 mt-0.5 rounded bg-violet-600 flex items-center justify-center shrink-0">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <title>Check</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">복사 가능 텍스트</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">결과 페이지에서 바로 복사할 수 있습니다.</span>
              </div>
            </div>
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-violet-300 ${
                options.pdf
                  ? "border-violet-400 bg-violet-50/40 ring-1 ring-violet-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={options.pdf}
                onChange={(e) => onOptionsChange({ ...options, pdf: e.target.checked })}
                className="w-4 h-4 mt-0.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">PDF 다운로드</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">인쇄용 PDF 파일을 생성합니다.</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onGuideOpen}
        className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <title>Help</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-semibold">어떤 옵션을 선택해야 할지 모르겠나요?</span>
      </button>
    </>
  );
}
