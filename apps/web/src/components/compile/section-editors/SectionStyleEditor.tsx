"use client";

import { useRef, useState } from "react";
import type { EditorFocus } from "@/stores/useEditorFocusStore";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import {
  DEFAULT_SECTION_STYLE,
  THEME_PRESETS,
  DEFAULT_IMAGE_DISPLAY,
  FONT_FAMILY_MAP,
} from "@gyoanmaker/shared/types";
import type { EditableSectionKey, FontFamily } from "@gyoanmaker/shared/types";
import UnifiedSectionEditor from "../template-settings/UnifiedSectionEditor";
import Page1LayoutSection from "../template-settings/Page1LayoutSection";
import VocabLayoutSection from "../template-settings/VocabLayoutSection";
import SummaryLanguageSection from "../template-settings/SummaryLanguageSection";
import { getEditableSectionKey } from "./modalConfig";
import { resizeImageToBase64 } from "@/lib/imageResize";
import { removeBackground } from "@/lib/removeBackground";

interface Props {
  sectionKey: EditorFocus;
}

export function SectionStyleEditor({ sectionKey }: Props) {
  switch (sectionKey) {
    case "header":
      return (
        <div className="space-y-5 py-2">
          <LogoEditor />
          <UnifiedSectionEditor sectionKey="header" />
        </div>
      );
    case "header-badge":
      return (
        <div className="space-y-5 py-2">
          <HeaderBadgeStyleEditor />
          <UnifiedSectionEditor sectionKey="headerBadge" />
        </div>
      );
    case "page1-title":
      return (
        <div className="space-y-5 py-2">
          <Page1TitleStyleEditor />
          <BadgeFontEditor />
        </div>
      );
    case "page1-body":
      return (
        <div className="space-y-5 py-2">
          <Page1LayoutSection />
          <UnifiedSectionEditor sectionKey="page1Body" />
        </div>
      );
    case "page2-header":
      return (
        <div className="space-y-5 py-2">
          <AvatarEditor />
          <SummaryBarWidthEditor />
          <UnifiedSectionEditor sectionKey="page2Header" />
        </div>
      );
    default: {
      const editKey = getEditableSectionKey(sectionKey) as EditableSectionKey;
      return (
        <div className="space-y-5 py-2">
          <UnifiedSectionEditor sectionKey={editKey} />
          {sectionKey === "vocabulary" && <VocabLayoutSection />}
          {sectionKey === "summary" && <SummaryLanguageSection />}
        </div>
      );
    }
  }
}

/* ─── Logo Editor (for Header modal) ─── */

function LogoEditor() {
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const setLogoBase64 = useTemplateSettingsStore((s) => s.setLogoBase64);
  const logoDisplay = useTemplateSettingsStore((s) => s.logoDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const setLogoDisplay = useTemplateSettingsStore((s) => s.setLogoDisplay);
  const [removingBg, setRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setLogoBase64(base64);
    } catch {
      // upload error — user can retry
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleRemoveBg() {
    if (!logoBase64 || removingBg) return;
    setRemovingBg(true);
    try {
      const result = await removeBackground(logoBase64);
      setLogoBase64(result);
    } catch {
      // silently fail
    } finally {
      setRemovingBg(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">로고</p>
      <div className="flex items-center gap-3">
        {logoBase64 ? (
          <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBase64} alt="로고" width={48} height={48} className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setLogoBase64(null)}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center leading-none"
            >
              x
            </button>
            {removingBg && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <SpinnerIcon />
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs shrink-0">
            로고
          </div>
        )}
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-[#5E35B1] hover:underline">
            {logoBase64 ? "변경" : "로고 업로드"}
          </button>
          {logoBase64 && (
            <button
              type="button"
              onClick={handleRemoveBg}
              disabled={removingBg}
              className="text-[10px] text-gray-400 hover:text-[#5E35B1] transition-colors disabled:opacity-50 flex items-center gap-0.5"
            >
              {removingBg ? "처리중..." : "배경 제거"}
            </button>
          )}
          <p className="text-[9px] text-gray-400 mt-0.5">120x120px, 200KB 이하</p>
        </div>
      </div>
      {logoBase64 && (
        <ImageSliders
          label="로고"
          scale={logoDisplay.scale}
          offsetX={logoDisplay.offsetX}
          offsetY={logoDisplay.offsetY}
          onChangeScale={(v) => setLogoDisplay({ scale: v })}
          onChangeOffsetX={(v) => setLogoDisplay({ offsetX: v })}
          onChangeOffsetY={(v) => setLogoDisplay({ offsetY: v })}
        />
      )}
    </div>
  );
}

/* ─── Avatar Editor (for Page2Header modal) ─── */

function AvatarEditor() {
  const avatarBase64 = useTemplateSettingsStore((s) => s.avatarBase64);
  const setAvatarBase64 = useTemplateSettingsStore((s) => s.setAvatarBase64);
  const avatarDisplay = useTemplateSettingsStore((s) => s.avatarDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const setAvatarDisplay = useTemplateSettingsStore((s) => s.setAvatarDisplay);
  const [removingBg, setRemovingBg] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await resizeImageToBase64(file);
      setAvatarBase64(base64);
    } catch {
      // upload error
    }
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleRemoveBg() {
    if (!avatarBase64 || removingBg) return;
    setRemovingBg(true);
    try {
      const result = await removeBackground(avatarBase64);
      setAvatarBase64(result);
    } catch {
      // silently fail
    } finally {
      setRemovingBg(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
        요약바 아바타
      </p>
      <div className="flex items-center gap-3">
        {avatarBase64 ? (
          <div className="relative w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarBase64} alt="캐릭터" width={48} height={48} className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => setAvatarBase64(null)}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center leading-none"
            >
              x
            </button>
            {removingBg && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <SpinnerIcon />
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/avatar.png" alt="기본" width={48} height={48} className="w-full h-full object-contain opacity-50" />
          </div>
        )}
        <div>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-xs font-bold text-[#5E35B1] hover:underline">
            {avatarBase64 ? "변경" : "이미지 업로드"}
          </button>
          {avatarBase64 && (
            <button
              type="button"
              onClick={handleRemoveBg}
              disabled={removingBg}
              className="text-[10px] text-gray-400 hover:text-[#5E35B1] transition-colors disabled:opacity-50 flex items-center gap-0.5"
            >
              {removingBg ? "처리중..." : "배경 제거"}
            </button>
          )}
          <p className="text-[9px] text-gray-400 mt-0.5">90x90px, 200KB 이하</p>
        </div>
      </div>
      <ImageSliders
        label="캐릭터"
        scale={avatarDisplay.scale}
        offsetX={avatarDisplay.offsetX}
        offsetY={avatarDisplay.offsetY}
        onChangeScale={(v) => setAvatarDisplay({ scale: v })}
        onChangeOffsetX={(v) => setAvatarDisplay({ offsetX: v })}
        onChangeOffsetY={(v) => setAvatarDisplay({ offsetY: v })}
      />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">레이어</span>
        <div className="flex gap-1">
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded ${avatarDisplay.layer === "front" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            onClick={() => setAvatarDisplay({ layer: "front" })}
          >
            앞
          </button>
          <button
            type="button"
            className={`px-2 py-0.5 text-[10px] rounded ${avatarDisplay.layer === "back" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
            onClick={() => setAvatarDisplay({ layer: "back" })}
          >
            뒤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Summary Bar Width ─── */

function SummaryBarWidthEditor() {
  const page2HeaderStyle = useTemplateSettingsStore((s) => s.page2HeaderStyle);
  const setPage2HeaderStyle = useTemplateSettingsStore((s) => s.setPage2HeaderStyle);
  const barWidth = page2HeaderStyle?.barWidth ?? 95;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">요약바 너비</p>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">너비</span>
        <input
          type="range"
          min={20}
          max={100}
          step={1}
          value={barWidth}
          onChange={(e) => setPage2HeaderStyle({ barWidth: Number(e.target.value) })}
          className="flex-1 h-1 accent-[#5E35B1]"
        />
        <span className="text-[9px] text-gray-500 w-8 text-right">{barWidth}%</span>
      </div>
    </div>
  );
}

/* ─── Header Badge Style (shape, height, padding) ─── */

function HeaderBadgeStyleEditor() {
  const headerBadgeStyle = useTemplateSettingsStore((s) => s.headerBadgeStyle) ?? DEFAULT_SECTION_STYLE;
  const setHeaderBadgeStyle = useTemplateSettingsStore((s) => s.setHeaderBadgeStyle);

  const badgeShape = headerBadgeStyle.badgeShape || "rounded-none";
  const badgeHeight = headerBadgeStyle.badgeHeight || 28;
  const badgePaddingX = headerBadgeStyle.badgePaddingX || 16;

  return (
    <>
      {/* Shape */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 모양</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { value: "rounded-full", label: "둥근" },
            { value: "rounded-lg", label: "약간 둥근" },
            { value: "rounded-none", label: "각진" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setHeaderBadgeStyle({ badgeShape: opt.value })}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                badgeShape === opt.value
                  ? "bg-[#5E35B1] text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Height */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 높이</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={18}
            max={56}
            step={2}
            value={badgeHeight}
            onChange={(e) => setHeaderBadgeStyle({ badgeHeight: Number(e.target.value) })}
            className="flex-1 h-1 accent-[#5E35B1]"
          />
          <span className="text-[9px] text-gray-500 w-10 text-right">{badgeHeight}px</span>
        </div>
      </div>

      {/* Badge Horizontal Padding */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 좌우 여백</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={8}
            max={48}
            step={2}
            value={badgePaddingX}
            onChange={(e) => setHeaderBadgeStyle({ badgePaddingX: Number(e.target.value) })}
            className="flex-1 h-1 accent-[#5E35B1]"
          />
          <span className="text-[9px] text-gray-500 w-10 text-right">{badgePaddingX}px</span>
        </div>
      </div>
    </>
  );
}

/* ─── Page1 Title Style (badge shape, color, size, alignment) ─── */

function Page1TitleStyleEditor() {
  const page1Style = useTemplateSettingsStore((s) => s.page1BodyStyle) ?? DEFAULT_SECTION_STYLE;
  const setPage1BodyStyle = useTemplateSettingsStore((s) => s.setPage1BodyStyle);
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const base = THEME_PRESETS[preset];
  const theme = useCustom && customColors ? { ...base, ...customColors } : base;
  const titleColor = page1Style.titleColor || theme.primary;
  const badgeBgColor = page1Style.badgeBgColor || "transparent";
  const badgeShape = page1Style.badgeShape || "rounded-full";
  const badgeFontSize = page1Style.badgeFontSize || 14;
  const badgeAlign = page1Style.badgeAlign || "left";
  const badgeHeight = page1Style.badgeHeight || 32;
  const badgePaddingX = page1Style.badgePaddingX || 20;

  return (
    <>
      {/* Colors */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">색상</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">테두리 / 글자 색상</span>
            <input
              type="color"
              value={titleColor}
              onChange={(e) => setPage1BodyStyle({ titleColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">배경색</span>
            <div className="flex items-center gap-2">
              {badgeBgColor !== "transparent" && (
                <button
                  type="button"
                  onClick={() => setPage1BodyStyle({ badgeBgColor: "transparent" })}
                  className="text-[10px] text-gray-400 hover:text-gray-600"
                >
                  초기화
                </button>
              )}
              <input
                type="color"
                value={badgeBgColor === "transparent" ? "#ffffff" : badgeBgColor}
                onChange={(e) => setPage1BodyStyle({ badgeBgColor: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shape */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 모양</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { value: "rounded-full", label: "둥근" },
            { value: "rounded-lg", label: "약간 둥근" },
            { value: "rounded-none", label: "각진" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPage1BodyStyle({ badgeShape: opt.value })}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                badgeShape === opt.value
                  ? "bg-[#5E35B1] text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">폰트 크기</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">{badgeFontSize}px</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage1BodyStyle({ badgeFontSize: Math.max(8, badgeFontSize - 1) })}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-xs font-bold text-gray-500"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setPage1BodyStyle({ badgeFontSize: Math.min(24, badgeFontSize + 1) })}
              className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-xs font-bold text-gray-500"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">정렬</p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { value: "left", label: "왼쪽" },
            { value: "center", label: "가운데" },
            { value: "right", label: "오른쪽" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPage1BodyStyle({ badgeAlign: opt.value })}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                badgeAlign === opt.value
                  ? "bg-[#5E35B1] text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Height */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 높이</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={20}
            max={56}
            step={2}
            value={badgeHeight}
            onChange={(e) => setPage1BodyStyle({ badgeHeight: Number(e.target.value) })}
            className="flex-1 h-1 accent-[#5E35B1]"
          />
          <span className="text-[9px] text-gray-500 w-10 text-right">{badgeHeight}px</span>
        </div>
      </div>

      {/* Badge Horizontal Padding */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">뱃지 좌우 여백</p>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={8}
            max={48}
            step={2}
            value={badgePaddingX}
            onChange={(e) => setPage1BodyStyle({ badgePaddingX: Number(e.target.value) })}
            className="flex-1 h-1 accent-[#5E35B1]"
          />
          <span className="text-[9px] text-gray-500 w-10 text-right">{badgePaddingX}px</span>
        </div>
      </div>
    </>
  );
}

/* ─── Shared Image Adjustment Sliders ─── */

function ImageSliders({
  label,
  scale,
  offsetX,
  offsetY,
  onChangeScale,
  onChangeOffsetX,
  onChangeOffsetY,
}: {
  label: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  onChangeScale: (v: number) => void;
  onChangeOffsetX: (v: number) => void;
  onChangeOffsetY: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold text-gray-400 uppercase">{label} 조정</p>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">크기</span>
        <input type="range" min={50} max={200} step={5} value={Math.round(scale * 100)} onChange={(e) => onChangeScale(Number(e.target.value) / 100)} className="flex-1 h-1 accent-[#5E35B1]" />
        <span className="text-[9px] text-gray-500 w-8 text-right">{Math.round(scale * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">좌우</span>
        <input type="range" min={-50} max={50} step={1} value={offsetX} onChange={(e) => onChangeOffsetX(Number(e.target.value))} className="flex-1 h-1 accent-[#5E35B1]" />
        <span className="text-[9px] text-gray-500 w-8 text-right">{offsetX}px</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-gray-400 w-6 shrink-0">상하</span>
        <input type="range" min={-50} max={50} step={1} value={offsetY} onChange={(e) => onChangeOffsetY(Number(e.target.value))} className="flex-1 h-1 accent-[#5E35B1]" />
        <span className="text-[9px] text-gray-500 w-8 text-right">{offsetY}px</span>
      </div>
    </div>
  );
}

/* ─── Badge Font Editor (for Page1 title badge, page1-title modal) ─── */

function BadgeFontEditor() {
  const page1TitleStyle = useTemplateSettingsStore((s) => s.page1TitleStyle);
  const setPage1TitleStyle = useTemplateSettingsStore((s) => s.setPage1TitleStyle);
  const globalFontFamily = useTemplateSettingsStore((s) => s.fontFamily);

  const effectiveFont = (page1TitleStyle?.fontFamily || globalFontFamily) as FontFamily;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">폰트</p>
      <div className="space-y-0.5">
        <label className="text-[10px] text-gray-500">뱃지 폰트 (한/영 통합)</label>
        <select
          value={page1TitleStyle?.fontFamily ?? ""}
          onChange={(e) => setPage1TitleStyle({ fontFamily: e.target.value as FontFamily | "" })}
          className="w-full py-1.5 px-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 focus:border-[#5E35B1] focus:outline-none appearance-none cursor-pointer"
          style={{ fontFamily: FONT_FAMILY_MAP[effectiveFont].css }}
        >
          <option value="">
            전체 설정 사용 ({FONT_FAMILY_MAP[globalFontFamily].label})
          </option>
          {(Object.keys(FONT_FAMILY_MAP) as FontFamily[]).map((key) => (
            <option key={key} value={key} style={{ fontFamily: FONT_FAMILY_MAP[key].css }}>
              {FONT_FAMILY_MAP[key].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ─── Spinner Icon ─── */

function SpinnerIcon() {
  return (
    <svg className="w-5 h-5 animate-spin text-[#5E35B1]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
