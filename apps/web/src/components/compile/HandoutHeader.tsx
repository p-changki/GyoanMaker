"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import {
  THEME_PRESETS,
  FONT_FAMILY_MAP,
  DEFAULT_SECTION_STYLE,
  TITLE_WEIGHT_MAP,
  DEFAULT_IMAGE_DISPLAY,
} from "@gyoanmaker/shared/types";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import type { EditorFocus } from "@/stores/useEditorFocusStore";
import { EditableHeaderText } from "./EditableFields";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { PencilHintIcon } from "./EditableHintBanner";
import SectionNumberBadge from "./SectionNumberBadge";

function useTheme() {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const base = THEME_PRESETS[preset];
  return useCustom && customColors ? { ...base, ...customColors } : base;
}

function HeaderClickZone({
  children,
  focusKey,
  label,
  className = "",
}: {
  children: React.ReactNode;
  focusKey: EditorFocus;
  label: string;
  className?: string;
}) {
  const focus = useEditorFocusStore((s) => s.focus);
  const setFocus = useEditorFocusStore((s) => s.setFocus);
  const isActive = focus === focusKey;
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const primary =
    useCustom && customColors?.primary
      ? customColors.primary
      : THEME_PRESETS[preset].primary;

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{
        outline: isActive ? `2px solid ${primary}` : undefined,
        outlineOffset: isActive ? "2px" : undefined,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setFocus(focusKey);
      }}
    >
      <div
        data-html2canvas-ignore="true"
        className={`absolute -top-0.5 -right-0.5 z-[100] px-1.5 py-0.5 text-[8px] font-bold text-white rounded-bl-lg rounded-tr-sm transition-opacity pointer-events-none ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80"
        }`}
        style={{ backgroundColor: primary }}
      >
        {isActive ? "편집 중" : label}
      </div>
      {children}
    </div>
  );
}

export function HandoutHeader({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  section: _section,
  pageNum = 1,
}: {
  section: HandoutSection;
  pageNum?: number;
}) {
  const theme = useTheme();
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const headerStyle =
    useTemplateSettingsStore((s) => s.headerStyle) ?? DEFAULT_SECTION_STYLE;
  const headerBadgeStyle =
    useTemplateSettingsStore((s) => s.headerBadgeStyle) ??
    DEFAULT_SECTION_STYLE;
  const globalFontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const academyName = useTemplateSettingsStore((s) => s.academyName);
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const logoDisplay =
    useTemplateSettingsStore((s) => s.logoDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const setAcademyName = useTemplateSettingsStore((s) => s.setAcademyName);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Derive effective colors from headerStyle
  const hTitleColor = headerStyle.titleColor || theme.primary;
  const hBgColor = headerStyle.bgColor || theme.headerBg;
  const hFontCss = headerStyle.fontFamily
    ? FONT_FAMILY_MAP[headerStyle.fontFamily].css
    : globalFontFamily
      ? FONT_FAMILY_MAP[globalFontFamily].css
      : "GmarketSans, sans-serif";

  // Derive badge colors
  const badgeBg = headerBadgeStyle.bgColor || theme.primary;
  const badgeTextColor = headerBadgeStyle.titleColor || "#FFFFFF";
  const badgeFontCss = headerBadgeStyle.fontFamily
    ? FONT_FAMILY_MAP[headerBadgeStyle.fontFamily].css
    : undefined;

  // Derive font weights
  const globalTitleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const hWeight =
    TITLE_WEIGHT_MAP[headerStyle.titleWeight || globalTitleWeight]?.value ??
    700;
  const badgeWeight =
    TITLE_WEIGHT_MAP[headerBadgeStyle.titleWeight || globalTitleWeight]
      ?.value ?? 700;
  const badgeAlign = headerBadgeStyle.textAlign || "right";

  // Continuation pages: minimal header
  if (pageNum > 1) {
    return (
      <header
        className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 shrink-0"
        style={{
          backgroundColor: hBgColor,
          paddingTop: headerStyle.paddingTop
            ? `${headerStyle.paddingTop + 32}px`
            : undefined,
          paddingBottom: headerStyle.paddingBottom
            ? `${headerStyle.paddingBottom}px`
            : undefined,
          borderBottom:
            headerStyle.borderStyle && headerStyle.borderStyle !== "none"
              ? `1px ${headerStyle.borderStyle} ${headerStyle.borderColor || hTitleColor}`
              : undefined,
        }}
      >
        <div
          className={`flex items-center pb-3 pt-4 ${badgeAlign === "left" ? "flex-row-reverse justify-between" : badgeAlign === "center" ? "justify-center" : "justify-between"}`}
        >
          <HeaderClickZone focusKey="header" label="헤더">
            <div
              className="tracking-tighter leading-none"
              style={{ fontFamily: hFontCss, color: hTitleColor }}
            >
              {academyName ? (
                <span
                  style={{
                    fontSize: `${Math.round(fontSizes.headerLogo * 0.56)}px`,
                    fontWeight: hWeight,
                  }}
                >
                  {academyName}
                </span>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: `${Math.round(fontSizes.headerLogo * 0.67)}px`,
                      fontWeight: hWeight,
                    }}
                  >
                    L
                  </span>
                  <span
                    style={{
                      fontSize: `${Math.round(fontSizes.headerLogo * 0.67)}px`,
                      fontWeight: Math.max(400, hWeight - 200),
                    }}
                  >
                    ogic
                  </span>
                </>
              )}
            </div>
          </HeaderClickZone>
          <HeaderClickZone focusKey="header-badge" label="배지">
            <div
              className="px-3 py-1 shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: badgeBg,
                color: badgeTextColor,
                fontSize: `${fontSizes.headerBadge}px`,
                fontFamily: badgeFontCss,
                fontWeight: badgeWeight,
                paddingTop: headerBadgeStyle.paddingTop
                  ? `${headerBadgeStyle.paddingTop}px`
                  : undefined,
                paddingBottom: headerBadgeStyle.paddingBottom
                  ? `${headerBadgeStyle.paddingBottom}px`
                  : undefined,
                borderTop:
                  headerBadgeStyle.borderStyle &&
                  headerBadgeStyle.borderStyle !== "none"
                    ? `1px ${headerBadgeStyle.borderStyle} ${headerBadgeStyle.borderColor || badgeBg}`
                    : undefined,
              }}
            >
              <EditableHeaderText />
            </div>
          </HeaderClickZone>
        </div>
        {!headerStyle.borderStyle && (
          <div
            className="absolute bottom-0 left-0 w-full h-[3px]"
            style={{ backgroundColor: hTitleColor }}
          />
        )}
      </header>
    );
  }

  // First page: full header
  return (
    <header
      className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 shrink-0"
      style={{
        backgroundColor: hBgColor,
        paddingTop: headerStyle.paddingTop
          ? `${headerStyle.paddingTop + 32}px`
          : undefined,
        paddingBottom: headerStyle.paddingBottom
          ? `${headerStyle.paddingBottom}px`
          : undefined,
        borderBottom:
          headerStyle.borderStyle && headerStyle.borderStyle !== "none"
            ? `1px ${headerStyle.borderStyle} ${headerStyle.borderColor || hTitleColor}`
            : undefined,
      }}
    >
      <SectionNumberBadge sectionKey="handout" defaultNumber="01" color={hTitleColor} />

      <div
        className={`flex items-end pb-4 pt-6 gap-4 ${badgeAlign === "left" ? "flex-row-reverse justify-between" : badgeAlign === "center" ? "justify-center" : "justify-between"}`}
      >
        <HeaderClickZone focusKey="header" label="헤더" className="flex-1">
          <div className="flex flex-col relative h-[56px] justify-end">
            <h1
              className="tracking-tighter leading-none"
              style={{ fontFamily: hFontCss, color: hTitleColor }}
            >
              <button
                type="button"
                onClick={() => setIsNameModalOpen(true)}
                className="group/edit bg-transparent border-0 p-0 m-0 hover:opacity-80 transition-opacity inline-flex items-center gap-1.5"
                style={{ color: hTitleColor }}
                aria-label="학원명 편집"
              >
                {academyName ? (
                  <span
                    className="border-b border-dashed border-transparent group-hover/edit:border-current/40 transition-colors"
                    style={{
                      fontSize: `${fontSizes.headerLogo}px`,
                      fontWeight: hWeight,
                    }}
                  >
                    {academyName}
                  </span>
                ) : (
                  <span className="border-b border-dashed border-transparent group-hover/edit:border-current/40 transition-colors">
                    <span
                      style={{
                        fontSize: `${fontSizes.headerLogo}px`,
                        fontWeight: hWeight,
                      }}
                    >
                      L
                    </span>
                    <span
                      style={{
                        fontSize: `${fontSizes.headerLogo}px`,
                        fontWeight: Math.max(400, hWeight - 200),
                      }}
                    >
                      ogic
                    </span>
                  </span>
                )}
                <PencilHintIcon className="opacity-0 group-hover/edit:opacity-50" />
              </button>
            </h1>
          </div>
        </HeaderClickZone>
        <HeaderClickZone
          focusKey="header-badge"
          label="배지"
          className="shrink-0"
        >
          <div
            className="px-4 py-1.5 whitespace-nowrap translate-y-4 relative z-20"
            style={{
              backgroundColor: badgeBg,
              color: badgeTextColor,
              fontSize: `${fontSizes.headerBadge}px`,
              fontFamily: badgeFontCss,
              fontWeight: badgeWeight,
              paddingTop: headerBadgeStyle.paddingTop
                ? `${headerBadgeStyle.paddingTop}px`
                : undefined,
              paddingBottom: headerBadgeStyle.paddingBottom
                ? `${headerBadgeStyle.paddingBottom}px`
                : undefined,
              borderTop:
                headerBadgeStyle.borderStyle &&
                headerBadgeStyle.borderStyle !== "none"
                  ? `1px ${headerBadgeStyle.borderStyle} ${headerBadgeStyle.borderColor || badgeBg}`
                  : undefined,
            }}
          >
            <EditableHeaderText />
          </div>
        </HeaderClickZone>
      </div>

      {/* Custom logo — right side */}
      {logoBase64 && (
        <div
          className="absolute top-2 right-8 md:right-12 xl:right-16 z-0"
          style={{
            transform: `translate(${logoDisplay.offsetX}px, ${logoDisplay.offsetY}px)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            alt="학원 로고"
            className="object-contain"
            style={{
              width: `${140 * logoDisplay.scale}px`,
              height: `${140 * logoDisplay.scale}px`,
            }}
          />
        </div>
      )}

      {!headerStyle.borderStyle && (
        <div
          className="absolute bottom-0 left-0 w-full h-[3px]"
          style={{ backgroundColor: hTitleColor }}
        />
      )}

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
          style={{
            borderColor: themeColor,
            boxShadow: `0 0 0 1px ${themeColor}`,
          }}
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
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = themeColorDark)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = themeColor)
            }
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
      <span
        className="font-black text-[#E5E7EB]"
        style={{ fontSize: `${fontSizes.pageFooter}px` }}
      >
        PAGE {section.passageId.slice(1)}-{pageNum}
      </span>
    </footer>
  );
}
