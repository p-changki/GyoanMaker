"use client";

import { useState } from "react";

export interface ExportSelection {
  handout: boolean;
  vocabBank: boolean;
  workbook: boolean;
}

interface ExportSelectModalProps {
  mode: "copy" | "download";
  hasVocabBank: boolean;
  hasWorkbook: boolean;
  onConfirm: (selection: ExportSelection) => void;
  onClose: () => void;
}

export default function ExportSelectModal({
  mode,
  hasVocabBank,
  hasWorkbook,
  onConfirm,
  onClose,
}: ExportSelectModalProps) {
  const [selection, setSelection] = useState<ExportSelection>({
    handout: true,
    vocabBank: hasVocabBank,
    workbook: hasWorkbook,
  });

  const toggle = (key: keyof ExportSelection) => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const noneSelected = !selection.handout && !selection.vocabBank && !selection.workbook;
  const actionLabel = mode === "copy" ? "복사" : "다운로드";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[320px] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-black text-gray-800">
          {mode === "copy" ? "텍스트 복사" : "TXT 다운로드"} — 포함할 내용 선택
        </h2>

        <div className="space-y-3">
          {/* 교안 (always shown) */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selection.handout}
              onChange={() => toggle("handout")}
              className="w-4 h-4 accent-[#5E35B1]"
            />
            <span className="text-sm font-semibold text-gray-700">교안</span>
          </label>

          {/* 보카뱅크 */}
          {hasVocabBank && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selection.vocabBank}
                onChange={() => toggle("vocabBank")}
                className="w-4 h-4 accent-[#5E35B1]"
              />
              <span className="text-sm font-semibold text-gray-700">보카뱅크</span>
            </label>
          )}

          {/* 워크북 */}
          {hasWorkbook && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selection.workbook}
                onChange={() => toggle("workbook")}
                className="w-4 h-4 accent-[#5E35B1]"
              />
              <span className="text-sm font-semibold text-gray-700">워크북</span>
            </label>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(selection);
              onClose();
            }}
            disabled={noneSelected}
            className="flex-1 py-2.5 rounded-xl bg-[#5E35B1] text-sm font-bold text-white hover:bg-[#4527A0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
