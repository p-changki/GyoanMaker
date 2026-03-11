"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PencilHintIcon } from "./EditableHintBanner";

/* ─── Shared Edit Modal (input) ─── */

function EditTextModal({
  label,
  value,
  maxLength = 500,
  themeColor = "#5E35B1",
  multiline = false,
  onConfirm,
  onClose,
}: {
  label: string;
  value: string;
  maxLength?: number;
  themeColor?: string;
  multiline?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = multiline ? textareaRef.current : inputRef.current;
    el?.focus();
    const len = el?.value.length ?? 0;
    el?.setSelectionRange(len, len);
  }, [multiline]);

  const handleConfirm = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed) onConfirm(trimmed);
    else onClose();
  }, [draft, onConfirm, onClose]);

  const sharedInputStyles =
    "w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none";

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = themeColor;
    e.currentTarget.style.boxShadow = `0 0 0 1px ${themeColor}`;
  };
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "";
    e.currentTarget.style.boxShadow = "";
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-[480px] max-w-[90vw] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={draft}
            maxLength={maxLength}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${sharedInputStyles} min-h-[120px] resize-y leading-relaxed`}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={maxLength}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={sharedInputStyles}
          />
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors"
            style={{ backgroundColor: themeColor }}
          >
            적용
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── EditableText Component ─── */

export const EditableText = memo(function EditableText({
  value,
  label,
  maxLength = 500,
  multiline = false,
  themeColor = "#5E35B1",
  onConfirm,
  className = "",
  style,
  as: Tag = "span",
  renderDisplay,
}: {
  value: string;
  label: string;
  maxLength?: number;
  multiline?: boolean;
  themeColor?: string;
  onConfirm: (newValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: "span" | "p" | "div";
  /** Custom display renderer. Receives raw value, returns ReactNode. */
  renderDisplay?: (value: string) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = useCallback(
    (newValue: string) => {
      onConfirm(newValue);
      setIsOpen(false);
    },
    [onConfirm],
  );

  return (
    <>
      <Tag
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`group/editable cursor-pointer hover:bg-gray-50/60 rounded transition-colors relative ${className}`}
        style={style}
      >
        {renderDisplay ? renderDisplay(value) : value}
        <span
          className="inline-flex ml-1 opacity-0 group-hover/editable:opacity-60 transition-opacity align-middle"
          data-html2canvas-ignore="true"
        >
          <PencilHintIcon className="" />
        </span>
      </Tag>
      {isOpen && (
        <EditTextModal
          label={label}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          themeColor={themeColor}
          onConfirm={handleConfirm}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
});
