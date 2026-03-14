"use client";

import { createContext, memo, useCallback, useMemo, useState } from "react";
import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import {
  THEME_PRESETS,
  FONT_FAMILY_MAP,
  TITLE_WEIGHT_MAP,
  DEFAULT_PAGE1_LAYOUT,
  DEFAULT_SECTION_STYLE,
  DEFAULT_IMAGE_DISPLAY,
} from "@gyoanmaker/shared/types";
import {
  EditableAnalysisTitle,
  EditableSummaryTitleText,
} from "./EditableFields";
import { EditableText } from "./EditableText";
import { HandoutFooter, HandoutHeader } from "./HandoutHeader";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { BUILTIN_SECTION_COMPONENTS, CustomSection, VocabularySection } from "./page2-sections";
import { isCustomSectionKey } from "@gyoanmaker/shared/types";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";
import { useTemplateFontLoader } from "./useTemplateFontLoader";
import { updateSentenceText } from "@/lib/sectionUpdaters";
import SortableSection from "./SortableSection";

export const ExtendedVocabLayoutContext = createContext(false);

function useTheme() {
  useTemplateFontLoader();
  const themePreset = useTemplateSettingsStore((s) => s.themePreset);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const fontFamilyKo = useTemplateSettingsStore((s) => s.fontFamilyKo);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const useCustomTheme = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customThemeColors = useTemplateSettingsStore(
    (s) => s.customThemeColors
  );

  const baseColors = THEME_PRESETS[themePreset];
  const colors =
    useCustomTheme && customThemeColors
      ? { ...baseColors, ...customThemeColors }
      : baseColors;

  return {
    ...colors,
    fontSizes,
    fontCss: FONT_FAMILY_MAP[fontFamily].css,
    fontCssKo: FONT_FAMILY_MAP[fontFamilyKo || fontFamily].css,
    titleFontWeight: TITLE_WEIGHT_MAP[titleWeight].value,
  };
}

const ClickZone = memo(function ClickZone({
  children,
  focusKey,
  label,
  className = "",
}: {
  children: React.ReactNode;
  focusKey: import("@/stores/useEditorFocusStore").EditorFocus;
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
      className={`relative group/zone cursor-pointer rounded transition-all ${className}`}
      style={
        isActive
          ? { outline: `2px solid ${primary}`, outlineOffset: "2px" }
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        openModal(focusKey);
      }}
    >
      {children}
      {/* Edit hint — hidden from PDF via data-html2canvas-ignore */}
      <div
        data-html2canvas-ignore="true"
        className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white pointer-events-none transition-opacity z-50 ${
          isActive ? "opacity-100" : "opacity-0 group-hover/zone:opacity-80"
        }`}
        style={{ backgroundColor: primary }}
      >
        {label}
      </div>
    </div>
  );
});

// Small inline number chip shown before the analysis title badge.
function PassageNumberChip({
  passageId,
  themeColor,
}: {
  passageId: string;
  themeColor: string;
}) {
  const passageNumber = passageId.slice(1).padStart(2, "0");
  return (
    <div className="relative flex flex-col items-start w-fit translate-y-0 z-10 shrink-0">
      {/* "Number" Label */}
      <span
        className="absolute -top-[14px] left-0"
        style={{
          fontSize: "10px",
          color: "#2C3E50", // Dark blue-grey as in image
          fontWeight: 800,
          letterSpacing: "0.05em",
          lineHeight: 1,
        }}
      >
        Number
      </span>

      {/* Main Number Block Box */}
      <div className="relative">
        <div
          className="flex items-center justify-center relative z-10"
          style={{
            backgroundColor: themeColor,
            padding: "0 10px",
            minWidth: "42px",
            height: "32px", // Fixed 32px height to match Pill exactly
          }}
        >
          {/* Folded corner (Ribbon effect at bottom-left) */}
          <div
            className="absolute -bottom-1.5 left-0 w-0 h-0 border-solid"
            style={{
              borderWidth: "6px 6px 0 0",
              borderColor: `${themeColor} transparent transparent transparent`,
              filter: "brightness(0.7)", // darker shade of the theme color
            }}
          />
          <span
            className="font-black text-white"
            style={{
              fontSize: "20px",
              lineHeight: 1,
              fontFamily: '"Arial Black", "Impact", sans-serif', // Boldest sans
            }}
          >
            {passageNumber}
          </span>
        </div>

        {/* Right Shadow Drop */}
        <div
          className="absolute top-1 -right-[3px] w-[3px] h-full z-0"
          style={{ backgroundColor: "#D1D5DB" }}
        />
      </div>
    </div>
  );
}

function renderSentenceNumber(
  index: number,
  pageNum: number,
  style: "padded" | "plain" | "circle"
): React.ReactNode {
  const num = (pageNum - 1) * 7 + index + 1;
  if (style === "padded") return String(num).padStart(2, "0");
  if (style === "plain") return String(num);
  const circled = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
  return num <= 20 ? circled[num - 1] : String(num);
}

export function ParsedHandoutViewPage1({
  section,
  sentencesChunk,
  pageNum,
  globalPageNumber,
  pageKey,
}: {
  section: HandoutSection;
  sentencesChunk: { en: string; ko: string }[];
  pageNum: number;
  globalPageNumber?: number;
  pageKey?: string;
}) {
  const theme = useTheme();
  const page1Layout =
    useTemplateSettingsStore((s) => s.page1Layout) ?? DEFAULT_PAGE1_LAYOUT;
  const page1Style =
    useTemplateSettingsStore((s) => s.page1BodyStyle) ?? DEFAULT_SECTION_STYLE;
  const page1TitleStyle =
    useTemplateSettingsStore((s) => s.page1TitleStyle);
  const page1TitleVisible = useTemplateSettingsStore((s) => s.page1TitleVisible) ?? true;
  const setPage1TitleVisible = useTemplateSettingsStore((s) => s.setPage1TitleVisible);

  const updateSection = useHandoutStore((s) => s.updateSection);

  const handleSentenceEdit = useCallback(
    (localIndex: number, field: "en" | "ko", value: string) => {
      const globalIndex = (pageNum - 1) * 7 + localIndex;
      updateSection(
        section.passageId,
        updateSentenceText(section, globalIndex, field, value)
      );
    },
    [pageNum, section, updateSection]
  );

  const p1TitleColor = page1Style.titleColor || theme.primary;
  const accentColor = theme.primaryDark ?? theme.primary;
  const p1TextColor = page1Style.textColor || "#111827";
  const p1FontFamily = page1Style.fontFamily
    ? FONT_FAMILY_MAP[page1Style.fontFamily].css
    : theme.fontCss;
  const p1FontFamilyKo = page1Style.fontFamilyKo
    ? FONT_FAMILY_MAP[page1Style.fontFamilyKo].css
    : theme.fontCssKo;
  // Badge title font — independent from sentence text font
  const p1BadgeFontFamily = page1TitleStyle?.fontFamily
    ? FONT_FAMILY_MAP[page1TitleStyle.fontFamily].css
    : p1FontFamily;
  const p1TextAlign = (page1Style.textAlign || "justify") as
    | "left"
    | "center"
    | "justify"
    | "right";
  const badgeShape = page1Style.badgeShape || "rounded-full";
  const badgeBgColor = page1Style.badgeBgColor || "transparent";
  const badgeFontSize = page1Style.badgeFontSize || 14;
  const badgeAlign = page1Style.badgeAlign || "left";
  const badgeHeight = page1Style.badgeHeight || 32;
  const badgePaddingX = page1Style.badgePaddingX || 20;

  const enRatio = page1Layout.sentenceColumnRatio;
  const koRatio = 1 - enRatio;
  const borderWidth = page1Layout.tableOuterBorderWidth;
  const showSentenceNumbers = page1Layout.showSentenceNumbers ?? true;
  const showKoreanColumn = page1Layout.showKoreanColumn ?? true;

  const tableBorderStyle = useMemo(
    () => ({
      borderTop: `${borderWidth}px solid ${accentColor}`,
      borderBottom: `${borderWidth}px solid ${accentColor}`,
      paddingTop: page1Style.paddingTop
        ? `${page1Style.paddingTop}px`
        : undefined,
      paddingBottom: page1Style.paddingBottom
        ? `${page1Style.paddingBottom}px`
        : undefined,
    }),
    [borderWidth, accentColor, page1Style.paddingTop, page1Style.paddingBottom]
  );

  const enTextStyle = useMemo(
    () =>
      ({
        fontSize: `${theme.fontSizes.analysisEn}pt`,
        fontFamily: p1FontFamily,
        color: p1TextColor,
        textAlign: p1TextAlign,
      }) as const,
    [theme.fontSizes.analysisEn, p1FontFamily, p1TextColor, p1TextAlign]
  );

  const koTextStyle = useMemo(
    () =>
      ({
        fontSize: `${theme.fontSizes.analysisKo}pt`,
        fontFamily: p1FontFamilyKo,
        color: p1TextColor,
        textAlign: p1TextAlign,
      }) as const,
    [theme.fontSizes.analysisKo, p1FontFamilyKo, p1TextColor, p1TextAlign]
  );

  return (
    <div
      className="p-8 md:p-12 xl:p-16 flex flex-col flex-1 bg-white relative"
      onClick={() => { /* no-op: modal closes via backdrop/Escape */ }}
    >
      {page1Layout.headerVisible && (
        <HandoutHeader section={section} pageNum={pageNum} />
      )}

      <section className="mb-8 relative flex-1 w-full">
        {page1TitleVisible ? (
          <div className="relative group/p1-title">
            <ClickZone focusKey="page1-title" label="타이틀 편집">
              <div
                className={`mt-4 mb-4 z-10 relative flex items-center ${badgeAlign === "center" ? "justify-center" : badgeAlign === "right" ? "justify-end" : "justify-start"}`}
              >
                {/* Passage number chip — only on first page of each passage */}
                {pageNum === 1 && (
                  <div className="relative z-20">
                    <PassageNumberChip
                      passageId={section.passageId}
                      themeColor={p1TitleColor}
                    />
                  </div>
                )}
                <div
                  className={`flex w-fit items-center justify-center font-bold border ${badgeShape} relative z-10 ${pageNum === 1 ? "-ml-3" : ""}`}
                  style={{
                    color: p1TitleColor,
                    borderColor: p1TitleColor,
                    backgroundColor:
                      badgeBgColor === "transparent" ? "white" : badgeBgColor,
                    fontSize: `${badgeFontSize + 1}px`,
                    height: `${badgeHeight}px`,
                    paddingLeft: pageNum === 1 ? `${badgePaddingX + 4}px` : `${badgePaddingX - 2}px`,
                    paddingRight: `${badgePaddingX}px`,
                    letterSpacing: "0.01em",
                    fontFamily: p1BadgeFontFamily,
                  }}
                >
                  <EditableAnalysisTitle passageId={section.passageId} />
                </div>
              </div>
            </ClickZone>
            {/* Hide button — hidden from PDF */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={(e) => { e.stopPropagation(); setPage1TitleVisible(false); }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/p1-title:opacity-100 transition-opacity z-50 p-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-red-50 hover:border-red-300"
              aria-label="타이틀 숨기기"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m7.656 7.656l2.829 2.829M6.343 6.343l11.314 11.314M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        ) : (
          /* Show button when hidden — hidden from PDF */
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={() => setPage1TitleVisible(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 mt-4 mb-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.857-.646 1.67-1.108 2.418M2.458 12a11.95 11.95 0 001.108 2.418" />
            </svg>
            <span className="text-[11px] font-medium">타이틀 표시</span>
          </button>
        )}

        <ClickZone focusKey="page1-body" label="문장 테이블">
          <div className="w-full" style={tableBorderStyle}>
            <div className="flex relative w-full">
              {showKoreanColumn && (
                <div
                  className="absolute top-0 right-0 h-full"
                  style={{
                    width: `${koRatio * 100}%`,
                    backgroundColor: `${theme.sentenceBg}80`,
                  }}
                />
              )}
              <div className="flex flex-col w-full relative z-10 divide-y divide-[#E5E7EB]">
                {sentencesChunk.map((pair, i) => (
                  <div
                    key={`${pair.en}-${pair.ko}-${i}`}
                    className="flex min-h-[80px] w-full"
                  >
                    <div
                      className="flex py-6 pr-6"
                      style={{ width: `${enRatio * 100}%` }}
                    >
                      {showSentenceNumbers && (
                        <div
                          className="w-8 shrink-0 font-black pt-0.5"
                          style={{
                            color: p1TitleColor,
                            fontSize: `${theme.fontSizes.sentenceNumber}px`,
                          }}
                        >
                          {renderSentenceNumber(
                            i,
                            pageNum,
                            page1Layout.numberStyle
                          )}
                        </div>
                      )}
                      <EditableText
                        value={pair.en.replace(
                          /^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/,
                          ""
                        )}
                        label={`영어 문장 #${(pageNum - 1) * 7 + i + 1}`}
                        multiline
                        themeColor={p1TitleColor}
                        onConfirm={(v) => handleSentenceEdit(i, "en", v)}
                        className="flex-1 font-normal leading-[2.1]"
                        style={enTextStyle}
                        as="div"
                      />
                    </div>
                    {showKoreanColumn && (
                      <div
                        className="py-6 pl-6 pr-4"
                        style={{ width: `${koRatio * 100}%` }}
                      >
                        <EditableText
                          value={pair.ko.replace(
                            /^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/,
                            ""
                          )}
                          label={`한국어 번역 #${(pageNum - 1) * 7 + i + 1}`}
                          multiline
                          themeColor={p1TitleColor}
                          onConfirm={(v) => handleSentenceEdit(i, "ko", v)}
                          className="font-normal leading-[2.1]"
                          style={koTextStyle}
                          as="div"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Shadow rendered as real DOM for html2canvas PDF compatibility */}
          <div
            className="w-[95%] h-[6px] rounded-b-xl"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.06) 40%, transparent 100%)",
              marginTop: "-3px",
            }}
          />
        </ClickZone>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} globalPageNumber={globalPageNumber} pageKey={pageKey} />
    </div>
  );
}

function DiscoveryBanner() {
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("gyoan_hint_dismissed") === "1"
  );

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("gyoan_hint_dismissed", "1");
  }

  return (
    <div
      data-html2canvas-ignore="true"
      className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-[#5E35B1]/5 border border-[#5E35B1]/20"
    >
      <p className="text-[10px] text-[#5E35B1] font-medium">
        프리뷰의 각 영역을 클릭하면 해당 섹션만 편집할 수 있습니다
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-[10px] text-gray-400 hover:text-gray-600 ml-2 shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

export function ParsedHandoutViewPage2({
  section,
  pageNum,
  globalPageNumber,
  pageKey,
  hideVocab,
}: {
  section: HandoutSection;
  pageNum: number;
  globalPageNumber?: number;
  pageKey?: string;
  hideVocab?: boolean;
}) {
  const theme = useTheme();
  const page2Sections = useTemplateSettingsStore((s) => s.page2Sections);
  const avatarBase64 = useTemplateSettingsStore((s) => s.avatarBase64);
  const avatarDisplay =
    useTemplateSettingsStore((s) => s.avatarDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);
  const page2HeaderStyle = useTemplateSettingsStore((s) => s.page2HeaderStyle);
  const page2HeaderVisible = useTemplateSettingsStore((s) => s.page2HeaderVisible) ?? true;
  const setPage2HeaderVisible = useTemplateSettingsStore((s) => s.setPage2HeaderVisible);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const current = useTemplateSettingsStore.getState().page2Sections;
    const oldIndex = current.indexOf(active.id as Page2SectionKey);
    const newIndex = current.indexOf(over.id as Page2SectionKey);
    if (oldIndex === -1 || newIndex === -1) return;

    useTemplateSettingsStore.setState({
      page2Sections: arrayMove([...current], oldIndex, newIndex),
    });
  }, []);


  const avatarStyle = useMemo(
    () => ({
      top: `${-46 + avatarDisplay.offsetY}px`,
      left: `${24 + avatarDisplay.offsetX}px`,
      width: `${90 * avatarDisplay.scale}px`,
      height: `${90 * avatarDisplay.scale}px`,
    }),
    [avatarDisplay.offsetY, avatarDisplay.offsetX, avatarDisplay.scale]
  );

  return (
    <ExtendedVocabLayoutContext.Provider value={!!hideVocab}>
    <div
      className="px-6 pb-6 pt-20 md:px-8 md:pb-8 md:pt-20 xl:px-10 xl:pb-10 xl:pt-24 flex flex-col flex-1 bg-white relative"
      onClick={() => { /* no-op: modal closes via backdrop/Escape */ }}
    >
      <DiscoveryBanner />
      <section className={`mb-2 relative w-full ${hideVocab ? "flex flex-col flex-1" : "flex-1"}`}>
        {/* Avatar - only rendered when custom image is set */}
        {avatarBase64 && (
          <div
            className={`absolute ${avatarDisplay.layer === "back" ? "z-0" : "z-20"}`}
            style={avatarStyle}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarBase64}
              loading="lazy"
              alt="Teacher Avatar"
              className="w-full h-full object-contain"
              style={{
                filter:
                  "drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))",
              }}
            />
          </div>
        )}

        {page2HeaderVisible ? (
          <div className="relative group/summary-bar">
            <ClickZone focusKey="page2-header" label="요약바">
              <div
                data-summary-bar
                className="relative z-10 mb-3 rounded-xl flex items-center mt-1"
                style={{
                  width: `${page2HeaderStyle?.barWidth ?? 95}%`,
                  minHeight: "40px",
                  backgroundColor: page2HeaderStyle?.bgColor || theme.primary,
                  paddingTop: `${(page2HeaderStyle?.paddingTop ?? 0) + 10}px`,
                  paddingBottom: `${(page2HeaderStyle?.paddingBottom ?? 0) + 10}px`,
                  paddingRight: "16px",
                  overflow: "visible",
                  borderTop:
                    page2HeaderStyle?.borderStyle &&
                    page2HeaderStyle.borderStyle !== "none"
                      ? `1px ${page2HeaderStyle.borderStyle} ${page2HeaderStyle.borderColor || theme.primaryDark || theme.primary}`
                      : undefined,
                }}
              >
                <span
                  className="tracking-wide z-30 flex-1"
                  style={{
                    fontFamily: page2HeaderStyle?.fontFamily
                      ? FONT_FAMILY_MAP[page2HeaderStyle.fontFamily].css
                      : "GmarketSans, sans-serif",
                    fontWeight: theme.titleFontWeight,
                    fontSize: `${theme.fontSizes.summaryBarTitle}px`,
                    lineHeight: 1.2,
                    color: page2HeaderStyle?.titleColor || "#FFFFFF",
                    marginLeft: (() => {
                      if (!avatarBase64) return "24px";
                      const avatarML = Math.round(24 + avatarDisplay.offsetX + 90 * avatarDisplay.scale + 8);
                      const barPct = (page2HeaderStyle?.barWidth ?? 95) / 100;
                      const barPx = 794 * barPct;
                      const maxML = Math.round(barPx * 0.4);
                      return `${Math.min(avatarML, maxML)}px`;
                    })(),
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    textAlign: (page2HeaderStyle?.textAlign || "left") as "left" | "center" | "right" | "justify",
                  }}
                >
                  <EditableSummaryTitleText />
                </span>
              </div>
            </ClickZone>
            {/* Hide button — hidden from PDF */}
            <button
              type="button"
              data-html2canvas-ignore="true"
              onClick={(e) => { e.stopPropagation(); setPage2HeaderVisible(false); }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/summary-bar:opacity-100 transition-opacity z-50 p-1.5 bg-white border border-gray-200 rounded-full shadow-md hover:bg-red-50 hover:border-red-300"
              aria-label="요약바 숨기기"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.7 11.7 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m7.656 7.656l2.829 2.829M6.343 6.343l11.314 11.314M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        ) : (
          /* Show button when hidden — hidden from PDF */
          <button
            type="button"
            data-html2canvas-ignore="true"
            onClick={() => setPage2HeaderVisible(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 mb-3 mt-1 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-400 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-.274.857-.646 1.67-1.108 2.418M2.458 12a11.95 11.95 0 001.108 2.418" />
            </svg>
            <span className="text-[11px] font-medium">요약바 표시</span>
          </button>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={page2Sections} strategy={verticalListSortingStrategy}>
            <div className={hideVocab ? "flex flex-col gap-4 pl-2" : "space-y-2 pl-2"}>
              {page2Sections.map((key) => {
                // Skip standalone flow when visual_summary is present (flow is embedded inside it)
                if (key === "flow" && page2Sections.includes("visual_summary"))
                  return null;
                // Skip vocabulary on page2 when vocab count > 4 (rendered on separate page3)
                if (key === "vocabulary" && hideVocab) return null;
                const style = sectionStyles?.[key];
                const wrapStyle = {
                  paddingTop: style?.paddingTop ?? 0,
                  paddingBottom: style?.paddingBottom ?? 0,
                  borderTop:
                    style?.borderStyle && style.borderStyle !== "none"
                      ? `1px ${style.borderStyle} ${style.borderColor || theme.primaryDark || theme.primary}`
                      : undefined,
                };
                if (isCustomSectionKey(key)) {
                  return (
                    <SortableSection key={key} id={key}>
                      <ClickZone focusKey={key} label="커스텀 섹션">
                        <div style={wrapStyle}>
                          <CustomSection sectionKey={key} />
                        </div>
                      </ClickZone>
                    </SortableSection>
                  );
                }
                const Component = BUILTIN_SECTION_COMPONENTS[key];
                return (
                  <SortableSection key={key} id={key}>
                    <ClickZone focusKey={key} label="섹션 편집">
                      <div style={wrapStyle}>
                        <Component section={section} />
                      </div>
                    </ClickZone>
                  </SortableSection>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} globalPageNumber={globalPageNumber} pageKey={pageKey} />
    </div>
    </ExtendedVocabLayoutContext.Provider>
  );
}

export function ParsedHandoutViewPage3({
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
  const theme = useTheme();
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);

  const vocabStyle = sectionStyles?.["vocabulary"];
  const wrapStyle = {
    paddingTop: vocabStyle?.paddingTop ?? 0,
    paddingBottom: vocabStyle?.paddingBottom ?? 0,
    borderTop:
      vocabStyle?.borderStyle && vocabStyle.borderStyle !== "none"
        ? `1px ${vocabStyle.borderStyle} ${vocabStyle.borderColor || theme.primaryDark || theme.primary}`
        : undefined,
  };

  return (
    <div
      className="px-6 pb-6 pt-20 md:px-8 md:pb-8 md:pt-20 xl:px-10 xl:pb-10 xl:pt-24 flex flex-col flex-1 bg-white relative"
      onClick={() => { /* no-op */ }}
    >
      <section className="mb-2 relative flex-1 w-full">
        <div className="space-y-2 pl-2">
          <ClickZone focusKey="vocabulary" label="섹션 편집">
            <div style={wrapStyle}>
              <VocabularySection section={section} />
            </div>
          </ClickZone>
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} globalPageNumber={globalPageNumber} pageKey={pageKey} />
    </div>
  );
}
