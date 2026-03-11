"use client";

import type React from "react";
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
import { EditableText } from "./EditableText";
import { useHandoutStore } from "@/stores/useHandoutStore";

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
  const modalKey = useEditorFocusStore((s) => s.modalKey);
  const openModal = useEditorFocusStore((s) => s.openModal);
  const isActive = modalKey === focusKey;
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
        openModal(focusKey);
      }}
    >
      <div
        data-html2canvas-ignore="true"
        className={`absolute -top-0.5 -right-0.5 z-[100] px-1.5 py-0.5 text-[8px] font-bold text-white rounded-bl-lg rounded-tr-sm transition-opacity pointer-events-none ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80"
        }`}
        style={{ backgroundColor: primary }}
      >
        {label}
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
  const openModal = useEditorFocusStore((s) => s.openModal);

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
  const hBadgeShape = headerBadgeStyle.badgeShape || "rounded-none";
  const hBadgeHeight = headerBadgeStyle.badgeHeight || 28;
  const hBadgePaddingX = headerBadgeStyle.badgePaddingX || 16;

  // Continuation pages: minimal header (badge only, no logo)
  if (pageNum > 1) {
    return (
      <header
        className="mb-8 relative -mx-8 px-8 md:-mx-12 md:px-12 xl:-mx-16 xl:px-16 -mt-8 pt-8 md:-mt-12 md:pt-12 xl:-mt-16 xl:pt-16 shrink-0"
        style={{
          backgroundColor: hBgColor,
          borderBottom:
            headerStyle.borderStyle && headerStyle.borderStyle !== "none"
              ? `1px ${headerStyle.borderStyle} ${headerStyle.borderColor || hTitleColor}`
              : undefined,
        }}
      >
        <div className="flex items-end justify-end pb-4 pt-4">
          <HeaderClickZone focusKey="header-badge" label="배지">
            <div
              className={`shrink-0 whitespace-nowrap translate-y-4 ${hBadgeShape}`}
              style={{
                backgroundColor: badgeBg,
                color: badgeTextColor,
                fontSize: `${fontSizes.headerBadge}px`,
                fontFamily: badgeFontCss,
                fontWeight: badgeWeight,
                height: `${hBadgeHeight}px`,
                paddingLeft: `${hBadgePaddingX}px`,
                paddingRight: `${hBadgePaddingX}px`,
                display: "flex",
                width: "fit-content",
                alignItems: "center",
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
                onClick={(e) => { e.stopPropagation(); openModal("header"); }}
                className="group/edit bg-transparent border-0 p-0 m-0 hover:opacity-80 transition-opacity relative"
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
                <span
                  className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover/edit:opacity-50 pointer-events-none"
                  data-html2canvas-ignore="true"
                >
                  <PencilHintIcon />
                </span>
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
            className={`whitespace-nowrap translate-y-4 relative z-20 ${hBadgeShape}`}
            style={{
              backgroundColor: badgeBg,
              color: badgeTextColor,
              fontSize: `${fontSizes.headerBadge}px`,
              fontFamily: badgeFontCss,
              fontWeight: badgeWeight,
              height: `${hBadgeHeight}px`,
              paddingLeft: `${hBadgePaddingX}px`,
              paddingRight: `${hBadgePaddingX}px`,
              display: "flex",
              width: "fit-content",
              alignItems: "center",
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

    </header>
  );
}

export function HandoutFooter({
  section,
  pageNum,
  globalPageNumber,
  pageKey,
}: {
  section: HandoutSection;
  pageNum: number;
  globalPageNumber?: number;
  pageKey?: string;
}) {
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const override = useHandoutStore((s) =>
    pageKey ? s.pageNumberOverrides[pageKey] : undefined
  );
  const setOverride = useHandoutStore((s) => s.setPageNumberOverride);
  const theme = useTheme();

  const displayValue =
    override !== undefined && override !== ""
      ? override
      : globalPageNumber !== undefined
        ? String(globalPageNumber)
        : "";

  return (
    <footer className="mt-auto pt-10 flex items-center justify-between shrink-0">
      <span
        className="font-black text-[#E5E7EB]"
        style={{ fontSize: `${fontSizes.pageFooter}px` }}
      >
        PAGE {section.passageId.slice(1)}-{pageNum}
      </span>
      {globalPageNumber !== undefined && pageKey && (
        <EditableText
          as="span"
          value={displayValue}
          label="페이지 번호 수정"
          themeColor={theme.primary}
          maxLength={10}
          onConfirm={(next) => setOverride(pageKey, next)}
          className="font-black text-[#E5E7EB]"
          style={{ fontSize: `${fontSizes.pageFooter}px` }}
        />
      )}
    </footer>
  );
}
