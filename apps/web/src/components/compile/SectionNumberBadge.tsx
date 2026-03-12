"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FONT_FAMILY_MAP,
  type FontFamily,
  type SectionBadgeConfig,
} from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { PencilHintIcon } from "./EditableHintBanner";

interface SectionNumberBadgeProps {
  sectionKey: "handout" | "workbook" | "vocabBank";
  defaultNumber: string;
  /** Badge background color from theme (used as fallback) */
  color: string;
}

const DEFAULT_BADGE_FONT = '"Arial Black", "Impact", sans-serif';

export default function SectionNumberBadge({
  sectionKey,
  defaultNumber,
  color,
}: SectionNumberBadgeProps) {
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const config = useTemplateSettingsStore((s) => s.sectionBadgeConfig?.[sectionKey]);
  const setSectionBadgeConfig = useTemplateSettingsStore((s) => s.setSectionBadgeConfig);
  const [isOpen, setIsOpen] = useState(false);

  const label = config?.label || defaultNumber;
  const textColor = config?.textColor || "#FFFFFF";
  const bgColor = config?.bgColor || color;
  const defaultFontSize = fontSizes.passageNumber + 18;
  const fontSize = config?.fontSize || defaultFontSize;
  const fontCss = config?.fontFamily
    ? FONT_FAMILY_MAP[config.fontFamily].css
    : DEFAULT_BADGE_FONT;
  const badgeWidth = config?.width || 168;
  const badgeHeight = config?.height || 86;

  const handleSave = useCallback(
    (partial: Partial<SectionBadgeConfig>) => {
      setSectionBadgeConfig(sectionKey, partial);
      setIsOpen(false);
    },
    [sectionKey, setSectionBadgeConfig]
  );

  return (
    <>
      <div
        className="absolute top-0 left-8 md:left-12 xl:left-16 z-20"
        style={{ width: `${badgeWidth}px`, height: `${badgeHeight}px` }}
      >
        {/* Solid Drop Shadow */}
        <div
          className="absolute top-[6px] left-[6px] bg-[#D1D5DB] rounded-b-[18px] z-0"
          style={{ width: `${badgeWidth}px`, height: `${badgeHeight}px` }}
        />
        {/* Main Background Block */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute top-0 left-0 rounded-b-[18px] flex items-start justify-start pl-4 pt-3 z-10 border-0 cursor-pointer group/badge"
          style={{ backgroundColor: bgColor, width: `${badgeWidth}px`, height: `${badgeHeight}px` }}
          aria-label="섹션 번호 편집"
        >
          <span
            className="font-black leading-none"
            style={{
              color: textColor,
              fontSize: `${fontSize}px`,
              fontFamily: fontCss,
              letterSpacing: "-0.04em",
            }}
          >
            {label}
          </span>
          <PencilHintIcon className="opacity-0 group-hover/badge:opacity-70 ml-1" />
        </button>
      </div>

      {isOpen && (
        <BadgeEditModal
          title={sectionKey === "handout" ? "교안 섹션 뱃지" : sectionKey === "workbook" ? "워크북 섹션 뱃지" : "보카 섹션 뱃지"}
          config={{ label, textColor, bgColor, fontFamily: config?.fontFamily || "", fontSize, width: badgeWidth, height: badgeHeight }}
          defaultNumber={defaultNumber}
          themeColor={color}
          onSave={handleSave}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

/* ─── Edit Modal ─── */

const FONT_OPTIONS: { value: FontFamily | ""; label: string }[] = [
  { value: "", label: "기본 (Arial Black)" },
  ...Object.entries(FONT_FAMILY_MAP).map(([key, v]) => ({
    value: key as FontFamily,
    label: v.label,
  })),
];

function BadgeEditModal({
  title,
  config,
  defaultNumber,
  themeColor,
  onSave,
  onClose,
}: {
  title: string;
  config: { label: string; textColor: string; bgColor: string; fontFamily: FontFamily | ""; fontSize: number; width: number; height: number };
  defaultNumber: string;
  themeColor: string;
  onSave: (partial: Partial<SectionBadgeConfig>) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(config.label);
  const [textColor, setTextColor] = useState(config.textColor);
  const [bgColor, setBgColor] = useState(config.bgColor);
  const [fontFamily, setFontFamily] = useState<FontFamily | "">(config.fontFamily);
  const [fontSize, setFontSize] = useState(config.fontSize);
  const [badgeWidth, setBadgeWidth] = useState(config.width);
  const [badgeHeight, setBadgeHeight] = useState(config.height);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmedLabel = label.trim().slice(0, 6);
    onSave({
      label: trimmedLabel || defaultNumber,
      textColor,
      bgColor: bgColor === themeColor ? "" : bgColor,
      fontFamily,
      fontSize,
      width: badgeWidth,
      height: badgeHeight,
    });
  }, [label, textColor, bgColor, fontFamily, fontSize, badgeWidth, badgeHeight, defaultNumber, themeColor, onSave]);

  // Preview font for the label
  const previewFont = fontFamily
    ? FONT_FAMILY_MAP[fontFamily].css
    : DEFAULT_BADGE_FONT;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-[380px] max-w-[90vw] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {title}
        </p>

        {/* Preview */}
        <div className="flex justify-center py-3">
          <div
            className="rounded-b-[18px] flex items-center justify-center"
            style={{
              backgroundColor: bgColor,
              width: `${Math.round(badgeWidth * 0.7)}px`,
              height: `${Math.round(badgeHeight * 0.7)}px`,
            }}
          >
            <span
              className="font-black leading-none"
              style={{
                color: textColor,
                fontSize: Math.min(fontSize, 36),
                fontFamily: previewFont,
                letterSpacing: "-0.04em",
              }}
            >
              {label || defaultNumber}
            </span>
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 mb-1 block">텍스트</label>
          <input
            ref={inputRef}
            type="text"
            value={label}
            maxLength={6}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleConfirm(); }
              if (e.key === "Escape") { e.preventDefault(); onClose(); }
            }}
            className="w-full px-3 py-2 text-sm font-bold text-gray-900 border border-gray-200 rounded-lg focus:outline-none text-center"
            style={{ borderColor: themeColor }}
          />
        </div>

        {/* Colors row */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-gray-400 mb-1 block">배경색</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0"
              />
              <span className="text-xs text-gray-500 font-mono">{bgColor}</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-gray-400 mb-1 block">글자색</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0"
              />
              <span className="text-xs text-gray-500 font-mono">{textColor}</span>
            </div>
          </div>
        </div>

        {/* Font */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 mb-1 block">폰트</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as FontFamily | "")}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none"
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Font size */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 mb-1 block">
            글자 크기 ({fontSize}px)
          </label>
          <input
            type="range"
            min={16}
            max={60}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-current"
            style={{ accentColor: themeColor }}
          />
        </div>

        {/* Badge dimensions */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-gray-400 mb-1 block">
              가로 ({badgeWidth}px)
            </label>
            <input
              type="range"
              min={80}
              max={280}
              step={4}
              value={badgeWidth}
              onChange={(e) => setBadgeWidth(Number(e.target.value))}
              className="w-full accent-current"
              style={{ accentColor: themeColor }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-gray-400 mb-1 block">
              세로 ({badgeHeight}px)
            </label>
            <input
              type="range"
              min={40}
              max={140}
              step={2}
              value={badgeHeight}
              onChange={(e) => setBadgeHeight(Number(e.target.value))}
              className="w-full accent-current"
              style={{ accentColor: themeColor }}
            />
          </div>
        </div>

        {/* Actions */}
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
    document.body
  );
}
