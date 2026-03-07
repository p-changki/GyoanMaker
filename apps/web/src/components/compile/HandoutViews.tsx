"use client";

import { useState } from "react";
import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP, DEFAULT_PAGE1_LAYOUT, DEFAULT_SECTION_STYLE } from "@gyoanmaker/shared/types";
import type { Page2SectionKey } from "@gyoanmaker/shared/types";
import { EditableAnalysisTitle, EditableSummaryTitleText } from "./EditableFields";
import { HandoutFooter, HandoutHeader } from "./HandoutHeader";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import { SECTION_COMPONENTS } from "./page2-sections";

function useTheme() {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);

  const baseColors = THEME_PRESETS[preset];
  const colors = useCustom && customColors ? { ...baseColors, ...customColors } : baseColors;

  return {
    ...colors,
    fontSizes,
    fontCss: FONT_FAMILY_MAP[fontFamily].css,
    titleFontWeight: TITLE_WEIGHT_MAP[titleWeight].value,
  };
}

function ClickZone({
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
  const focus = useEditorFocusStore((s) => s.focus);
  const setFocus = useEditorFocusStore((s) => s.setFocus);
  const isActive = focus === focusKey;
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const useCustom = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customColors = useTemplateSettingsStore((s) => s.customThemeColors);
  const primary = (useCustom && customColors?.primary) ? customColors.primary : THEME_PRESETS[preset].primary;

  return (
    <div
      className={`relative group/zone cursor-pointer rounded transition-all ${className}`}
      style={isActive ? { outline: `2px solid ${primary}`, outlineOffset: "2px" } : undefined}
      onClick={(e) => { e.stopPropagation(); setFocus(focusKey); }}
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
        {isActive ? "편집 중" : label}
      </div>
    </div>
  );
}

function renderSentenceNumber(index: number, pageNum: number, style: "padded" | "plain" | "circle"): React.ReactNode {
  const num = (pageNum - 1) * 10 + index + 1;
  if (style === "padded") return String(num).padStart(2, "0");
  if (style === "plain") return String(num);
  const circled = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
  return num <= 20 ? circled[num - 1] : String(num);
}

export function ParsedHandoutViewPage1({
  section,
  sentencesChunk,
  pageNum,
}: {
  section: HandoutSection;
  sentencesChunk: { en: string; ko: string }[];
  pageNum: number;
}) {
  const theme = useTheme();
  const page1Layout = useTemplateSettingsStore((s) => s.page1Layout) ?? DEFAULT_PAGE1_LAYOUT;
  const page1Style = useTemplateSettingsStore((s) => s.page1BodyStyle) ?? DEFAULT_SECTION_STYLE;
  const setFocus = useEditorFocusStore((s) => s.setFocus);

  const p1TitleColor = page1Style.titleColor || theme.primary;
  const p1TextColor = page1Style.textColor || "#111827";
  const p1FontFamily = page1Style.fontFamily ? FONT_FAMILY_MAP[page1Style.fontFamily].css : theme.fontCss;

  const enRatio = page1Layout.sentenceColumnRatio;
  const koRatio = 1 - enRatio;
  const borderWidth = page1Layout.tableOuterBorderWidth;

  return (
    <div
      className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative"
      onClick={() => setFocus("global")}
    >
      {page1Layout.headerVisible && (
        <HandoutHeader section={section} pageNum={pageNum} />
      )}

      <section className="mb-8 relative flex-1 w-full">
        <div
          className="inline-flex items-center justify-center bg-white text-sm font-bold px-3 py-1.5 border rounded-full mb-3 z-10 relative leading-none"
          style={{ color: p1TitleColor, borderColor: p1TitleColor }}
        >
          <span className="translate-y-px">
            <EditableAnalysisTitle pageNum={pageNum} />
          </span>
        </div>

        <ClickZone focusKey="page1-body" label="문장 테이블">
          <div
            className="w-full"
            style={{
              borderTop: `${borderWidth}px solid ${p1TitleColor}`,
              borderBottom: `${borderWidth}px solid ${p1TitleColor}`,
              paddingTop: page1Style.paddingTop ? `${page1Style.paddingTop}px` : undefined,
              paddingBottom: page1Style.paddingBottom ? `${page1Style.paddingBottom}px` : undefined,
            }}
          >
            <div className="flex relative w-full">
              <div
                className="absolute top-0 right-0 h-full"
                style={{ width: `${koRatio * 100}%`, backgroundColor: `${theme.sentenceBg}80` }}
              />
              <div className="flex flex-col w-full relative z-10 divide-y divide-[#E5E7EB]">
                {sentencesChunk.map((pair, i) => (
                  <div key={`${pair.en}-${pair.ko}-${i}`} className="flex min-h-[60px] w-full">
                    <div className="flex py-4 pr-6" style={{ width: `${enRatio * 100}%` }}>
                      <div
                        className="w-8 shrink-0 font-black pt-0.5"
                        style={{ color: p1TitleColor, fontSize: `${theme.fontSizes.sentenceNumber}px` }}
                      >
                        {renderSentenceNumber(i, pageNum, page1Layout.numberStyle)}
                      </div>
                      <div
                        className="flex-1 font-normal leading-[2.1]"
                        style={{ fontSize: `${theme.fontSizes.analysisEn}pt`, fontFamily: p1FontFamily, color: p1TextColor }}
                      >
                        {pair.en.replace(/^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/, "")}
                      </div>
                    </div>
                    <div className="py-4 pl-6 pr-4" style={{ width: `${koRatio * 100}%` }}>
                      <div
                        className="font-normal leading-[2.1]"
                        style={{ fontSize: `${theme.fontSizes.analysisKo}pt`, fontFamily: p1FontFamily, color: p1TextColor }}
                      >
                        {pair.ko.replace(/^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/, "")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ClickZone>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}

function DiscoveryBanner() {
  const [dismissed, setDismissed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("gyoan_hint_dismissed") === "1"
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
}: {
  section: HandoutSection;
  pageNum: number;
}) {
  const theme = useTheme();
  const page2Sections = useTemplateSettingsStore((s) => s.page2Sections);
  const avatarBase64 = useTemplateSettingsStore((s) => s.avatarBase64);
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);
  const page2HeaderStyle = useTemplateSettingsStore((s) => s.page2HeaderStyle);
  const setFocus = useEditorFocusStore((s) => s.setFocus);

  return (
    <div
      className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative"
      onClick={() => setFocus("global")}
    >
      <DiscoveryBanner />
      <section className="mb-14 relative flex-1 w-full">
        <ClickZone focusKey="page2-header" label="요약바">
          <div
            className="relative mb-10 h-12 rounded-r-xl flex items-center pr-10 w-[95%] mt-6"
            style={{
              backgroundColor: page2HeaderStyle?.bgColor || theme.primary,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
              paddingTop: page2HeaderStyle?.paddingTop ?? 0,
              paddingBottom: page2HeaderStyle?.paddingBottom ?? 0,
              borderTop: page2HeaderStyle?.borderStyle && page2HeaderStyle.borderStyle !== "none"
                ? `1px ${page2HeaderStyle.borderStyle} ${page2HeaderStyle.borderColor || theme.primary}`
                : undefined,
            }}
          >
            <div className="absolute -top-[40px] left-6 w-[90px] h-[90px] z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarBase64 ?? "/images/avatar.png"}
                alt="Teacher Avatar"
                className="w-full h-full object-contain"
                style={{ filter: "drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))" }}
              />
            </div>
            <span
              className="tracking-wide ml-32 z-30"
              style={{
                fontFamily: page2HeaderStyle?.fontFamily ? FONT_FAMILY_MAP[page2HeaderStyle.fontFamily].css : "GmarketSans, sans-serif",
                fontWeight: theme.titleFontWeight,
                fontSize: `${theme.fontSizes.summaryBarTitle}px`,
                color: page2HeaderStyle?.titleColor || "#FFFFFF",
              }}
            >
              <EditableSummaryTitleText />
            </span>
          </div>
        </ClickZone>

        <div className="space-y-8 pl-2">
          {page2Sections.map((key) => {
            const Component = SECTION_COMPONENTS[key];
            const style = sectionStyles?.[key];
            return (
              <ClickZone key={key} focusKey={key as Page2SectionKey} label="섹션 편집">
                <div
                  style={{
                    paddingTop: style?.paddingTop ?? 0,
                    paddingBottom: style?.paddingBottom ?? 0,
                    borderTop: style?.borderStyle && style.borderStyle !== "none"
                      ? `1px ${style.borderStyle} ${style.borderColor || theme.primary}`
                      : undefined,
                  }}
                >
                  <Component section={section} />
                </div>
              </ClickZone>
            );
          })}
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}
