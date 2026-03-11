"use client";

import { useState } from "react";
import { useWorkbookStore } from "@/stores/useWorkbookStore";

interface WorkbookConfigPanelProps {
  handoutTitle?: string;
  onGenerate: () => void;
}

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function Field({ label, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#5E35B1] focus:ring-2 focus:ring-[#5E35B1]/10"
      />
    </label>
  );
}

const MODEL_LABEL: Record<string, string> = {
  pro: "Pro (정밀)",
  flash: "Flash (속도)",
};

export default function WorkbookConfigPanel({
  handoutTitle,
  onGenerate,
}: WorkbookConfigPanelProps) {
  const config = useWorkbookStore((state) => state.config);
  const selectedModel = useWorkbookStore((state) => state.selectedModel);
  const isGenerating = useWorkbookStore((state) => state.isGenerating);
  const generateError = useWorkbookStore((state) => state.generateError);
  const updateConfig = useWorkbookStore((state) => state.updateConfig);
  const setSelectedModel = useWorkbookStore((state) => state.setSelectedModel);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <aside className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 2</p>
        <h3 className="text-lg font-bold text-gray-900">워크북 설정</h3>
        {handoutTitle && (
          <p className="truncate text-xs text-gray-500">선택 교안: {handoutTitle}</p>
        )}
      </header>

      <div className="space-y-3">
        <Field
          label="테스트 코드"
          value={config.testCode}
          placeholder="01"
          onChange={(value) => updateConfig({ testCode: value })}
        />
        <Field
          label="테스트 제목"
          value={config.testTitle}
          placeholder="Upgrade"
          onChange={(value) => updateConfig({ testTitle: value })}
        />
        <Field
          label="범위 설명"
          value={config.rangeDescription}
          placeholder="예: 공통영어1 비상(홍) 1과"
          onChange={(value) => updateConfig({ rangeDescription: value })}
        />
        <Field
          label="교사명"
          value={config.teacherName}
          placeholder="예: 하늘쌤이 항상 응원해♥"
          onChange={(value) => updateConfig({ teacherName: value })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600">모델 선택</p>
        <div className="grid grid-cols-2 gap-2">
          <label
            className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold transition ${
              selectedModel === "flash"
                ? "border-[#5E35B1] bg-[#F3E8FF] text-[#5E35B1]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={selectedModel === "flash"}
              onChange={() => setSelectedModel("flash")}
            />
            ⚡ 빠른 생성
          </label>
          <label
            className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-bold transition ${
              selectedModel === "pro"
                ? "border-[#5E35B1] bg-[#F3E8FF] text-[#5E35B1]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={selectedModel === "pro"}
              onChange={() => setSelectedModel("pro")}
            />
            ✦ 정밀 생성
          </label>
        </div>
      </div>

      {generateError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {generateError}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={isGenerating}
        className="w-full rounded-lg bg-[#5E35B1] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isGenerating ? "워크북 생성 중..." : "워크북 생성"}
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mx-auto">
              <svg className="h-6 w-6 text-[#5E35B1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>워크북 생성</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-gray-900">워크북 생성</h2>
              <p className="text-sm text-gray-500">AI가 워크북 문항을 자동 생성합니다.</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
              {handoutTitle && (
                <div className="flex justify-between">
                  <span className="text-gray-500">교안</span>
                  <span className="font-semibold text-gray-900 truncate max-w-40">{handoutTitle}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">모델</span>
                <span className="font-semibold text-gray-900">{MODEL_LABEL[selectedModel] ?? selectedModel}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 text-xs text-gray-400">
                생성 시 <span className="font-semibold text-[#5E35B1]">{selectedModel === "pro" ? "Pro" : "Flash"} 크레딧</span>이 차감됩니다.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  onGenerate();
                }}
                className="flex-1 rounded-xl bg-[#5E35B1] py-2.5 text-sm font-bold text-white transition hover:bg-[#4527A0]"
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
