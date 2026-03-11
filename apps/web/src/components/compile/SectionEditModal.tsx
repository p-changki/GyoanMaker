"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EditorFocus } from "@/stores/useEditorFocusStore";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import { SectionTextEditor } from "./section-editors/SectionTextEditor";
import { SectionStyleEditor } from "./section-editors/SectionStyleEditor";
import { SECTION_MODAL_CONFIG } from "./section-editors/modalConfig";

const SECTION_LABELS: Record<string, string> = {
  header: "헤더",
  "header-badge": "헤더 배지",
  "page1-title": "분석 타이틀",
  "page1-body": "문장 테이블",
  "page2-header": "요약바",
  visual_summary: "배경지식",
  topic: "주제문",
  summary: "요약",
  flow: "흐름",
  vocabulary: "어휘",
};

function getSectionLabel(key: EditorFocus): string {
  if (key.startsWith("custom_")) return "커스텀 섹션";
  return SECTION_LABELS[key] ?? key;
}

export default function SectionEditModal() {
  const modalKey = useEditorFocusStore((s) => s.modalKey);
  const closeModal = useEditorFocusStore((s) => s.closeModal);

  if (!modalKey) return null;

  return <SectionEditModalInner sectionKey={modalKey} onClose={closeModal} />;
}

function SectionEditModalInner({
  sectionKey,
  onClose,
}: {
  sectionKey: EditorFocus;
  onClose: () => void;
}) {
  const config = SECTION_MODAL_CONFIG[sectionKey] ?? { hasText: false, hasStyle: true };
  const hasText = sectionKey.startsWith("custom_") ? true : config.hasText;
  const hasStyle = config.hasStyle;

  const defaultTab = hasText ? "text" : "style";
  const [tab, setTab] = useState<"text" | "style">(defaultTab);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[92vw] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h3 className="text-sm font-bold text-gray-900">
            {getSectionLabel(sectionKey)} 편집
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        {hasText && hasStyle && (
          <div className="flex gap-1 px-6 pb-3 shrink-0">
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === "text"
                  ? "bg-[#5E35B1] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              텍스트
            </button>
            <button
              type="button"
              onClick={() => setTab("style")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tab === "style"
                  ? "bg-[#5E35B1] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              스타일
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          {tab === "text" && hasText ? (
            <SectionTextEditor sectionKey={sectionKey} />
          ) : (
            <SectionStyleEditor sectionKey={sectionKey} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#5E35B1] rounded-lg hover:bg-[#4527A0] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
