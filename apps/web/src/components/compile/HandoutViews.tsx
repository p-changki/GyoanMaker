"use client";

import { memo, useMemo, useState } from "react";
import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP, DEFAULT_PAGE1_LAYOUT, DEFAULT_SECTION_STYLE, DEFAULT_IMAGE_DISPLAY } from "@gyoanmaker/shared/types";
import { EditableAnalysisTitle, EditableSummaryTitleText } from "./EditableFields";
import { HandoutFooter, HandoutHeader } from "./HandoutHeader";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useEditorFocusStore } from "@/stores/useEditorFocusStore";
import { BUILTIN_SECTION_COMPONENTS, CustomSection } from "./page2-sections";
import { isCustomSectionKey } from "@gyoanmaker/shared/types";
import { useTemplateFontLoader } from "./useTemplateFontLoader";

function useTheme() {
  useTemplateFontLoader();
  const themePreset = useTemplateSettingsStore((s) => s.themePreset);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const useCustomTheme = useTemplateSettingsStore((s) => s.useCustomTheme);
  const customThemeColors = useTemplateSettingsStore((s) => s.customThemeColors);

  const baseColors = THEME_PRESETS[themePreset];
  const colors = useCustomTheme && customThemeColors ? { ...baseColors, ...customThemeColors } : baseColors;

  return {
    ...colors,
    fontSizes,
    fontCss: FONT_FAMILY_MAP[fontFamily].css,
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
});

function renderSentenceNumber(index: number, pageNum: number, style: "padded" | "plain" | "circle"): React.ReactNode {
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
  const p1TextAlign = (page1Style.textAlign || "left") as "left" | "center" | "right";
  const badgeShape = page1Style.badgeShape || "rounded-full";
  const badgeBgColor = page1Style.badgeBgColor || "transparent";
  const badgeFontSize = page1Style.badgeFontSize || 14;
  const badgeAlign = page1Style.badgeAlign || "left";

  const enRatio = page1Layout.sentenceColumnRatio;
  const koRatio = 1 - enRatio;
  const borderWidth = page1Layout.tableOuterBorderWidth;
  const showSentenceNumbers = page1Layout.showSentenceNumbers ?? true;
  const showKoreanColumn = page1Layout.showKoreanColumn ?? true;

  const tableBorderStyle = useMemo(() => ({
    borderTop: `${borderWidth}px solid ${p1TitleColor}`,
    borderBottom: `${borderWidth}px solid ${p1TitleColor}`,
    paddingTop: page1Style.paddingTop ? `${page1Style.paddingTop}px` : undefined,
    paddingBottom: page1Style.paddingBottom ? `${page1Style.paddingBottom}px` : undefined,
  }), [borderWidth, p1TitleColor, page1Style.paddingTop, page1Style.paddingBottom]);

  const enTextStyle = useMemo(() => ({
    fontSize: `${theme.fontSizes.analysisEn}pt`,
    fontFamily: p1FontFamily,
    color: p1TextColor,
    textAlign: p1TextAlign,
  } as const), [theme.fontSizes.analysisEn, p1FontFamily, p1TextColor, p1TextAlign]);

  const koTextStyle = useMemo(() => ({
    fontSize: `${theme.fontSizes.analysisKo}pt`,
    fontFamily: p1FontFamily,
    color: p1TextColor,
    textAlign: p1TextAlign,
  } as const), [theme.fontSizes.analysisKo, p1FontFamily, p1TextColor, p1TextAlign]);

  return (
    <div
      className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative"
      onClick={() => setFocus("global")}
    >
      {page1Layout.headerVisible && (
        <HandoutHeader section={section} pageNum={pageNum} />
      )}

      <section className="mb-8 relative flex-1 w-full">
        <ClickZone focusKey="page1-title" label="타이틀 편집">
          <div
            className={`mb-3 z-10 relative ${badgeAlign === "center" ? "text-center" : badgeAlign === "right" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-flex items-center justify-center font-bold px-3 py-1.5 border leading-none ${badgeShape}`}
              style={{
                color: p1TitleColor,
                borderColor: p1TitleColor,
                backgroundColor: badgeBgColor === "transparent" ? "white" : badgeBgColor,
                fontSize: `${badgeFontSize}px`,
              }}
            >
              <span className="translate-y-px">
                <EditableAnalysisTitle pageNum={pageNum} />
              </span>
            </div>
          </div>
        </ClickZone>

        <ClickZone focusKey="page1-body" label="문장 테이블">
          <div
            className="w-full"
            style={tableBorderStyle}
          >
            <div className="flex relative w-full">
              {showKoreanColumn && (
                <div
                  className="absolute top-0 right-0 h-full"
                  style={{ width: `${koRatio * 100}%`, backgroundColor: `${theme.sentenceBg}80` }}
                />
              )}
              <div className="flex flex-col w-full relative z-10 divide-y divide-[#E5E7EB]">
                {sentencesChunk.map((pair, i) => (
                  <div key={`${pair.en}-${pair.ko}-${i}`} className="flex min-h-[80px] w-full">
                    <div className="flex py-6 pr-6" style={{ width: `${enRatio * 100}%` }}>
                      {showSentenceNumbers && (
                        <div
                          className="w-8 shrink-0 font-black pt-0.5"
                          style={{ color: p1TitleColor, fontSize: `${theme.fontSizes.sentenceNumber}px` }}
                        >
                          {renderSentenceNumber(i, pageNum, page1Layout.numberStyle)}
                        </div>
                      )}
                      <div
                        className="flex-1 font-normal leading-[2.1]"
                        style={enTextStyle}
                      >
                        {pair.en.replace(/^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/, "")}
                      </div>
                    </div>
                    {showKoreanColumn && (
                      <div className="py-6 pl-6 pr-4" style={{ width: `${koRatio * 100}%` }}>
                        <div
                          className="font-normal leading-[2.1]"
                          style={koTextStyle}
                        >
                          {pair.ko.replace(/^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/, "")}
                        </div>
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
              background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.06) 40%, transparent 100%)",
              marginTop: "-3px",
            }}
          />
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
  const avatarDisplay = useTemplateSettingsStore((s) => s.avatarDisplay) ?? DEFAULT_IMAGE_DISPLAY;
  const sectionStyles = useTemplateSettingsStore((s) => s.sectionStyles);
  const page2HeaderStyle = useTemplateSettingsStore((s) => s.page2HeaderStyle);
  const setFocus = useEditorFocusStore((s) => s.setFocus);

  const avatarStyle = useMemo(() => ({
    top: `${-46 + avatarDisplay.offsetY}px`,
    left: `${24 + avatarDisplay.offsetX}px`,
    width: `${90 * avatarDisplay.scale}px`,
    height: `${90 * avatarDisplay.scale}px`,
  }), [avatarDisplay.offsetY, avatarDisplay.offsetX, avatarDisplay.scale]);

  return (
    <div
      className="px-6 pb-6 pt-20 md:px-8 md:pb-8 md:pt-20 xl:px-10 xl:pb-10 xl:pt-24 flex flex-col h-full bg-white relative"
      onClick={() => setFocus("global")}
    >
      <DiscoveryBanner />
      <section className="mb-2 relative flex-1 w-full">
        {/* Avatar - separate from bar for z-index layering */}
        <div
          className={`absolute ${avatarDisplay.layer === "back" ? "z-0" : "z-20"}`}
          style={avatarStyle}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarBase64 ?? "/images/avatar.png"}
            loading="lazy"
            alt="Teacher Avatar"
            className="w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))" }}
          />
        </div>

        <ClickZone focusKey="page2-header" label="요약바">
          <div
            className="relative z-10 mb-3 h-10 rounded-r-xl flex items-center pr-10 w-[95%] mt-1"
            style={{
              backgroundColor: page2HeaderStyle?.bgColor || theme.primary,
              
              paddingTop: page2HeaderStyle?.paddingTop ?? 0,
              paddingBottom: page2HeaderStyle?.paddingBottom ?? 0,
              borderTop: page2HeaderStyle?.borderStyle && page2HeaderStyle.borderStyle !== "none"
                ? `1px ${page2HeaderStyle.borderStyle} ${page2HeaderStyle.borderColor || theme.primary}`
                : undefined,
            }}
          >
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

        <div className="space-y-2 pl-2">
          {page2Sections.map((key) => {
            // Skip standalone flow when visual_summary is present (flow is embedded inside it)
            if (key === "flow" && page2Sections.includes("visual_summary")) return null;
            const style = sectionStyles?.[key];
            const wrapStyle = {
              paddingTop: style?.paddingTop ?? 0,
              paddingBottom: style?.paddingBottom ?? 0,
              borderTop: style?.borderStyle && style.borderStyle !== "none"
                ? `1px ${style.borderStyle} ${style.borderColor || theme.primary}`
                : undefined,
            };
            if (isCustomSectionKey(key)) {
              return (
                <ClickZone key={key} focusKey={key} label="커스텀 섹션">
                  <div style={wrapStyle}>
                    <CustomSection sectionKey={key} />
                  </div>
                </ClickZone>
              );
            }
            const Component = BUILTIN_SECTION_COMPONENTS[key];
            return (
              <ClickZone key={key} focusKey={key} label="섹션 편집">
                <div style={wrapStyle}>
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
