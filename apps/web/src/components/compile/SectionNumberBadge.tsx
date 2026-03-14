"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FONT_FAMILY_MAP,
  type FontFamily,
  type SectionBadgeConfig,
  type BadgeShape,
  type BadgePosition,
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

function getShapeBorderRadius(shape: BadgeShape, width: number, height: number): string {
  switch (shape) {
    case "rounded-b":
      return "0 0 18px 18px";
    case "rounded":
      return "18px";
    case "square":
      return "0";
    case "circle":
      return `${Math.max(width, height)}px`;
    default:
      return "0 0 18px 18px";
  }
}

function getPositionClass(position: BadgePosition): string {
  switch (position) {
    case "left":
      return "left-8 md:left-12 xl:left-16";
    case "center":
      return "left-1/2 -translate-x-1/2";
    case "right":
      return "right-8 md:right-12 xl:right-16";
    default:
      return "left-8 md:left-12 xl:left-16";
  }
}

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
  const shape: BadgeShape = config?.shape || "rounded-b";
  const position: BadgePosition = config?.position || "left";

  const borderRadius = getShapeBorderRadius(shape, badgeWidth, badgeHeight);
  const positionClass = getPositionClass(position);

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
        className={`absolute top-0 ${positionClass} z-20`}
        style={{ width: `${badgeWidth}px`, height: `${badgeHeight}px` }}
      >
        {/* Solid Drop Shadow */}
        <div
          className="absolute top-[6px] left-[6px] bg-[#D1D5DB] z-0"
          style={{
            width: `${badgeWidth}px`,
            height: `${badgeHeight}px`,
            borderRadius,
          }}
        />
        {/* Main Background Block */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="absolute top-0 left-0 flex items-center justify-center z-10 border-0 cursor-pointer group/badge"
          style={{
            backgroundColor: bgColor,
            width: `${badgeWidth}px`,
            height: `${badgeHeight}px`,
            borderRadius,
            paddingTop: "4px",
          }}
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
          config={{
            label, textColor, bgColor,
            fontFamily: config?.fontFamily || "",
            fontSize, width: badgeWidth, height: badgeHeight,
            shape, position,
          }}
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

const SHAPE_OPTIONS: { value: BadgeShape; label: string; icon: React.ReactNode }[] = [
  {
    value: "rounded-b",
    label: "하단 라운드",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="2" width="16" height="20" rx="0" ry="0" style={{ borderRadius: "0 0 8px 8px" }} /><path d="M4 2h16v14c0 4.418-3.582 8-8 8s-8-3.582-8-8V2z" /></svg>,
  },
  {
    value: "rounded",
    label: "라운드",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="6" /></svg>,
  },
  {
    value: "square",
    label: "사각형",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="0" /></svg>,
  },
  {
    value: "circle",
    label: "원형",
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" /></svg>,
  },
];

const POSITION_OPTIONS: { value: BadgePosition; label: string }[] = [
  { value: "left", label: "좌측" },
  { value: "center", label: "중앙" },
  { value: "right", label: "우측" },
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
  config: {
    label: string; textColor: string; bgColor: string;
    fontFamily: FontFamily | ""; fontSize: number;
    width: number; height: number;
    shape: BadgeShape; position: BadgePosition;
  };
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
  const [shape, setShape] = useState<BadgeShape>(config.shape);
  const [position, setPosition] = useState<BadgePosition>(config.position);
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
      shape,
      position,
    });
  }, [label, textColor, bgColor, fontFamily, fontSize, badgeWidth, badgeHeight, shape, position, defaultNumber, themeColor, onSave]);

  const previewFont = fontFamily
    ? FONT_FAMILY_MAP[fontFamily].css
    : DEFAULT_BADGE_FONT;

  const previewBorderRadius = getShapeBorderRadius(shape, badgeWidth, badgeHeight);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] max-w-[90vw] space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {title}
        </p>

        {/* Preview */}
        <div className="flex justify-center py-3">
          <div
            className="flex items-center justify-center"
            style={{
              backgroundColor: bgColor,
              width: `${Math.round(badgeWidth * 0.7)}px`,
              height: `${Math.round(badgeHeight * 0.7)}px`,
              borderRadius: previewBorderRadius,
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

        {/* Shape */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 mb-2 block">모양</label>
          <div className="flex gap-2">
            {SHAPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setShape(opt.value)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-colors flex-1 ${
                  shape === opt.value
                    ? "border-current bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={shape === opt.value ? { borderColor: themeColor, color: themeColor } : undefined}
              >
                <span className={shape === opt.value ? "" : "text-gray-400"}>{opt.icon}</span>
                <span className={`text-[10px] font-medium ${shape === opt.value ? "text-gray-700" : "text-gray-400"}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="text-[11px] font-semibold text-gray-400 mb-2 block">위치</label>
          <div className="flex gap-2">
            {POSITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPosition(opt.value)}
                className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                  position === opt.value
                    ? "text-white"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
                style={
                  position === opt.value
                    ? { backgroundColor: themeColor, borderColor: themeColor }
                    : undefined
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
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
