"use client";

import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

interface Props {
  onConfirm: (name: string) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export default function SaveTemplateModal({ onConfirm, onClose, isSaving }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submittingRef = useRef(false);

  const handleConfirm = useCallback(async () => {
    if (submittingRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError("이름을 입력하세요.");
      return;
    }
    setError(null);
    submittingRef.current = true;
    try {
      await onConfirm(trimmed);
    } finally {
      submittingRef.current = false;
    }
  }, [name, onConfirm]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] max-w-[90vw] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          템플릿 저장
        </p>
        <input
          type="text"
          value={name}
          maxLength={30}
          autoFocus
          placeholder="템플릿 이름 (최대 30자)"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
            if (e.key === "Escape") { e.preventDefault(); onClose(); }
          }}
          className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1]"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-white bg-[#5E35B1] hover:bg-[#4527A0] rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
