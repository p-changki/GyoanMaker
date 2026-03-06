"use client";

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS } from "@gyoanmaker/shared/types";
import { EditableHeaderText } from "./EditableFields";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { PencilHintIcon } from "./EditableHintBanner";

function useTheme() {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  return THEME_PRESETS[preset];
}

export function HandoutHeader({
  section,
  pageNum = 1,
}: {
  section: HandoutSection;
  pageNum?: number;
}) {
  const theme = useTheme();
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const academyName = useTemplateSettingsStore((s) => s.academyName);
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const setAcademyName = useTemplateSettingsStore((s) => s.setAcademyName);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Continuation pages: minimal header
  if (pageNum > 1) {
    return (
      <header
        className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 shrink-0"
        style={{ backgroundColor: theme.headerBg }}
      >
        <div className="flex items-center justify-between pb-3 pt-4">
          <div
            className="tracking-tighter leading-none"
            style={{ fontFamily: "GmarketSans, sans-serif", color: theme.primary }}
          >
            {academyName ? (
              <span className="font-bold" style={{ fontSize: `${Math.round(fontSizes.headerLogo * 0.56)}px` }}>{academyName}</span>
            ) : (
              <>
                <span className="font-bold" style={{ fontSize: `${Math.round(fontSizes.headerLogo * 0.67)}px` }}>L</span>
                <span className="font-medium" style={{ fontSize: `${Math.round(fontSizes.headerLogo * 0.67)}px` }}>ogic</span>
              </>
            )}
          </div>
          <div
            className="px-3 py-1 text-white font-bold shrink-0 whitespace-nowrap"
            style={{ backgroundColor: theme.primary, fontSize: `${fontSizes.headerBadge}px` }}
          >
            <EditableHeaderText />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[3px]" style={{ backgroundColor: theme.primary }} />
      </header>
    );
  }

  // First page: full header
  return (
    <header
      className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 shrink-0"
      style={{ backgroundColor: theme.headerBg }}
    >
      <div className="flex items-end justify-between pb-4 pt-6 gap-4">
        <div className="flex flex-col relative flex-1 h-[56px]">
          {/* Passage number badge */}
          <div className="absolute -top-[45px] left-0 bg-[#D1D5DB] rounded-b-[1.25rem] w-[64px] h-[60px] rounded-tr-none z-0 translate-x-2 translate-y-2" />
          <div
            className="absolute -top-[45px] left-0 rounded-b-[1.25rem] rounded-tr-none w-[64px] h-[60px] flex items-center justify-center z-10"
            style={{
              backgroundColor: theme.primary,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
            }}
          >
            <span className="text-white font-black tracking-tighter leading-none mt-1" style={{ fontSize: `${fontSizes.passageNumber}px` }}>
              {section.passageId.slice(1).padStart(2, "0")}
            </span>
          </div>

          <h1
            className="absolute bottom-0 left-0 tracking-tighter leading-none"
            style={{ fontFamily: "GmarketSans, sans-serif", color: theme.primary }}
          >
            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              className="group/edit bg-transparent border-0 p-0 m-0 hover:opacity-80 transition-opacity inline-flex items-center gap-1.5"
              style={{ color: theme.primary }}
              aria-label="학원명 편집"
            >
              {academyName ? (
                <span className="font-bold border-b border-dashed border-transparent group-hover/edit:border-current/40 transition-colors" style={{ fontSize: `${fontSizes.headerLogo}px` }}>
                  {academyName}
                </span>
              ) : (
                <span className="border-b border-dashed border-transparent group-hover/edit:border-current/40 transition-colors">
                  <span className="font-bold" style={{ fontSize: `${fontSizes.headerLogo}px` }}>L</span>
                  <span className="font-medium" style={{ fontSize: `${fontSizes.headerLogo}px` }}>ogic</span>
                </span>
              )}
              <PencilHintIcon className="opacity-0 group-hover/edit:opacity-50" />
            </button>
          </h1>
        </div>
        <div
          className="px-4 py-1.5 text-white font-bold shrink-0 whitespace-nowrap translate-y-4 relative z-20"
          style={{ backgroundColor: theme.primary, fontSize: `${fontSizes.headerBadge}px` }}
        >
          <EditableHeaderText />
        </div>
      </div>

      {/* Custom logo — right side */}
      {logoBase64 && (
        <div className="absolute top-2 right-8 md:right-12 xl:right-16 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt="학원 로고"
            className="w-[140px] h-[140px] object-contain"
          />
        </div>
      )}

      <div className="absolute bottom-0 left-0 w-full h-[3px]" style={{ backgroundColor: theme.primary }} />

      {isNameModalOpen && (
        <AcademyNameModal
          themeColor={theme.primary}
          themeColorDark={theme.primaryDark}
          currentName={academyName}
          onConfirm={(name) => {
            setAcademyName(name);
            setIsNameModalOpen(false);
          }}
          onClose={() => setIsNameModalOpen(false)}
        />
      )}
    </header>
  );
}

function AcademyNameModal({
  themeColor,
  themeColorDark,
  currentName,
  onConfirm,
  onClose,
}: {
  themeColor: string;
  themeColorDark: string;
  currentName: string | null;
  onConfirm: (name: string | null) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(currentName ?? "");

  const handleConfirm = useCallback(() => {
    const trimmed = draft.trim();
    onConfirm(trimmed === "" ? null : trimmed.slice(0, 20));
  }, [draft, onConfirm]);

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
          학원명
        </p>
        <input
          type="text"
          value={draft}
          maxLength={20}
          autoFocus
          placeholder="미입력 시 Logic"
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
          className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none text-center"
          style={{ borderColor: themeColor, boxShadow: `0 0 0 1px ${themeColor}` }}
        />
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
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColorDark)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = themeColor)}
          >
            적용
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function HandoutFooter({
  section,
  pageNum,
}: {
  section: HandoutSection;
  pageNum: number;
}) {
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  return (
    <footer className="mt-auto pt-10 flex items-center justify-end shrink-0">
      <span className="font-black text-[#E5E7EB]" style={{ fontSize: `${fontSizes.pageFooter}px` }}>
        PAGE {section.passageId.slice(1)}-{pageNum}
      </span>
    </footer>
  );
}
