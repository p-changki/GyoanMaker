"use client";

import type { ReactNode } from "react";
import {
  FONT_FAMILY_MAP,
  THEME_PRESETS,
  TITLE_WEIGHT_MAP,
  DEFAULT_SECTION_STYLE,
  DEFAULT_IMAGE_DISPLAY,
} from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { EditableHeaderText } from "./EditableFields";
import WorkbookStepBanner from "./WorkbookStepBanner";
import { useTemplateFontLoader } from "./useTemplateFontLoader";
import SectionNumberBadge from "./SectionNumberBadge";
import { EditableText } from "./EditableText";
import { useHandoutStore } from "@/stores/useHandoutStore";

interface WorkbookPageShellProps {
  sectionNumber: string; // e.g. "02" — sequential, continuing from handout passages
  sectionTitle: string; // e.g. "Upgrade" — from workbook config.testTitle
  stepBadge: string; // e.g. "Workbook" | "정답지"
  stepLabel: string; // e.g. "STEP 1 스스로 분석"
  globalPageNumber: number;
  pageKey?: string;
  /** Show step banner bar (default true) */
  showBanner?: boolean;
  /** Badge config key — "workbook" for workbook, "vocabBank" for voca bank (default "workbook") */
  badgeSectionKey?: "workbook" | "vocabBank";
  /** Inline edit callbacks — provided → renders EditableText; omitted → plain text */
  onEditSectionTitle?: (v: string) => void;
  onEditStepBadge?: (v: string) => void;
  onEditStepLabel?: (v: string) => void;
  children: ReactNode;
}

export default function WorkbookPageShell({
  sectionNumber,
  sectionTitle,
  stepBadge,
  stepLabel,
  globalPageNumber,
  pageKey,
  showBanner = true,
  badgeSectionKey = "workbook",
  onEditSectionTitle,
  onEditStepBadge,
  onEditStepLabel,
  children,
}: WorkbookPageShellProps) {
  useTemplateFontLoader();

  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const headerStyle =
    useTemplateSettingsStore((s) => s.headerStyle) ?? DEFAULT_SECTION_STYLE;
  const headerBadgeStyle =
    useTemplateSettingsStore((s) => s.headerBadgeStyle) ??
    DEFAULT_SECTION_STYLE;
  const logoBase64 = useTemplateSettingsStore((s) => s.logoBase64);
  const logoDisplay =
    useTemplateSettingsStore((s) => s.logoDisplay) ?? DEFAULT_IMAGE_DISPLAY;

  const base = THEME_PRESETS[preset];
  const colors =
    useCustom && customColors ? { ...base, ...customColors } : base;

  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const hFontCss = headerStyle.fontFamily
    ? FONT_FAMILY_MAP[headerStyle.fontFamily].css
    : fontCss;
  const globalWeightValue = TITLE_WEIGHT_MAP[titleWeight].value;
  const hWeight =
    TITLE_WEIGHT_MAP[headerStyle.titleWeight || titleWeight]?.value ?? 700;
  const badgeWeight =
    TITLE_WEIGHT_MAP[headerBadgeStyle.titleWeight || titleWeight]?.value ?? 700;

  const hTitleColor = headerStyle.titleColor || colors.primary;
  const hBgColor = headerStyle.bgColor || colors.headerBg;
  const badgeBg = headerBadgeStyle.bgColor || colors.primary;
  const badgeTextColor = headerBadgeStyle.titleColor || "#FFFFFF";
  const badgeFontCss = headerBadgeStyle.fontFamily
    ? FONT_FAMILY_MAP[headerBadgeStyle.fontFamily].css
    : undefined;
  const badgeAlign = headerBadgeStyle.textAlign || "right";

  return (
    <div
      className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative"
      style={{
        fontFamily: fontCss,
        fontWeight: globalWeightValue,
        color: "#111827",
      }}
    >
      {/* Header — mirrors HandoutHeader page-1 style with sectionNumber + sectionTitle */}
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
        <SectionNumberBadge sectionKey={badgeSectionKey} defaultNumber={sectionNumber} color={hTitleColor} />

        <div
          className={`flex items-end pb-4 pt-6 gap-4 ${
            badgeAlign === "left"
              ? "flex-row-reverse justify-between"
              : badgeAlign === "center"
                ? "justify-center"
                : "justify-between"
          }`}
        >
          {/* Left: section number box + title */}
          <div className="flex-1 flex flex-col relative justify-end h-[56px]">
            {/* Section title (e.g. "Upgrade") */}
            <h1
              className="tracking-tighter leading-none"
              style={{ fontFamily: hFontCss, color: hTitleColor }}
            >
              {onEditSectionTitle ? (
                <EditableText
                  as="span"
                  value={sectionTitle || "Workbook"}
                  label="섹션 타이틀 수정"
                  themeColor={hTitleColor}
                  maxLength={40}
                  onConfirm={onEditSectionTitle}
                  style={{ fontSize: `${fontSizes.headerLogo}px`, fontWeight: hWeight }}
                />
              ) : (
                <span
                  style={{
                    fontSize: `${fontSizes.headerLogo}px`,
                    fontWeight: hWeight,
                  }}
                >
                  {sectionTitle || "Workbook"}
                </span>
              )}
            </h1>
          </div>

          {/* Right: editable badge */}
          <div
            className="px-4 py-1.5 whitespace-nowrap translate-y-4 relative z-20 shrink-0"
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
                  ? `1px ${headerBadgeStyle.borderStyle} ${
                      headerBadgeStyle.borderColor || badgeBg
                    }`
                  : undefined,
            }}
          >
            <EditableHeaderText />
          </div>
        </div>

        {/* Custom logo */}
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

      {/* Step banner */}
      {showBanner && (
        <WorkbookStepBanner
          badge={stepBadge}
          label={stepLabel}
          onEditBadge={onEditStepBadge}
          onEditLabel={onEditStepLabel}
        />
      )}

      {/* Content */}
      <section className="flex-1 w-full overflow-hidden flex flex-col">{children}</section>

      {/* Footer */}
      <PageNumberFooter
        globalPageNumber={globalPageNumber}
        pageKey={pageKey}
        fontSize={fontSizes.pageFooter}
        themeColor={colors.primary}
      />
    </div>
  );
}

function PageNumberFooter({
  globalPageNumber,
  pageKey,
  fontSize,
  themeColor,
}: {
  globalPageNumber: number;
  pageKey?: string;
  fontSize: number;
  themeColor: string;
}) {
  const override = useHandoutStore((s) =>
    pageKey ? s.pageNumberOverrides[pageKey] : undefined
  );
  const setOverride = useHandoutStore((s) => s.setPageNumberOverride);

  const displayValue =
    override !== undefined && override !== ""
      ? override
      : String(globalPageNumber);

  return (
    <footer className="mt-auto pt-10 flex items-center justify-end shrink-0">
      {pageKey ? (
        <EditableText
          as="span"
          value={displayValue}
          label="페이지 번호 수정"
          themeColor={themeColor}
          maxLength={10}
          onConfirm={(next) => setOverride(pageKey, next)}
          className="font-black text-[#E5E7EB]"
          style={{ fontSize: `${fontSize}px` }}
        />
      ) : (
        <span
          className="font-black text-[#E5E7EB]"
          style={{ fontSize: `${fontSize}px` }}
        >
          {globalPageNumber}
        </span>
      )}
    </footer>
  );
}
