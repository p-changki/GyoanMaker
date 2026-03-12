"use client";

import { useMemo, useCallback } from "react";

import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useContext } from "react";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useHandoutStore, useIllustration } from "@/stores/useHandoutStore";
import { useSectionStyle } from "./useSectionStyle";
import { EditableText } from "../EditableText";
import { ExtendedVocabLayoutContext } from "../HandoutViews";

function statusLabel(status: string | undefined): string {
  if (status === "running") return "생성 중";
  if (status === "queued") return "대기 중";
  if (status === "failed") return "실패";
  if (status === "stale") return "재생성 필요";
  return "미생성";
}

/* ─── Main Component ─── */

export function VisualSummarySection({ section }: { section: HandoutSection }) {
  const illustration = useIllustration(section.passageId);
  const updateSection = useHandoutStore((s) => s.updateSection);

  const handleFlowEdit = useCallback(
    (index: number, text: string) => {
      const updatedFlow = section.flow.map((step, i) =>
        i === index ? { ...step, text } : step
      );
      updateSection(section.passageId, { ...section, flow: updatedFlow });
    },
    [section, updateSection]
  );
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, fontFamilyKo, titleWeight, textAlign, theme } =
    useSectionStyle("visual_summary");
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const fontCssKo = FONT_FAMILY_MAP[fontFamilyKo].css;
  const customTitles = useTemplateSettingsStore((s) => s.sectionTitles);
  const subSectionTitles = useTemplateSettingsStore((s) => s.subSectionTitles);
  const subSectionColors = useTemplateSettingsStore((s) => s.subSectionColors);

  const mainTitle = customTitles?.visual_summary || "VISUAL SUMMARY";
  const flowSubTitle = subSectionTitles?.visual_summary_flow || "내용 정리";
  const flowHeaderColor = subSectionColors?.visual_summary_flow_header || titleColor;
  const flowItemColor = subSectionColors?.visual_summary_flow_item || `${theme.sentenceBg}99`;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  const titleStyle = useMemo(() => ({
    fontFamily: "GmarketSans, sans-serif" as const,
    fontSize: `${fontSizes.sectionTitle}px`,
    fontWeight: titleFontWeight,
  }), [fontSizes.sectionTitle, titleFontWeight]);

  const flowItemStyle = useMemo(() => ({
    backgroundColor: flowItemColor,
    fontSize: `${Math.max(9, (fontSizes.flowText ?? fontSizes.visualEn) * 0.85)}px`,
    fontFamily: fontCssKo,
    color: textColor,
  }), [flowItemColor, fontSizes.flowText, fontSizes.visualEn, fontCssKo, textColor]);

  const isExtendedLayout = useContext(ExtendedVocabLayoutContext);
  const hasImage = !!illustration?.imageUrl;
  // Extended mode always uses stacked layout; standard mode always uses 2-column
  const useStackedLayout = isExtendedLayout;

  return (
    <div
      className="rounded-xl"
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {useStackedLayout ? (
        /* Stacked layout: extended vocab mode (>4 vocab), illustration or placeholder full-width */
        <div className="flex flex-col gap-3">
          {/* Illustration full width */}
          <div className="flex flex-col min-w-0">
            <div
              className="mb-2 flex w-fit items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg text-white self-start"
              style={{ backgroundColor: titleColor }}
            >
              <h3 className="leading-none" style={titleStyle}>{mainTitle}</h3>
            </div>
            <div className="overflow-hidden rounded-xl">
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={illustration!.imageUrl}
                  alt={`${section.passageId} visual summary`}
                  width={560}
                  height={315}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="block w-full max-h-64 rounded-xl object-contain"
                />
              ) : (
                <div className="flex min-h-30 flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-center text-xs text-gray-500">
                  <span>{statusLabel(illustration?.status)}: 일러스트 생성 후 여기에 표시됩니다.</span>
                  {(illustration?.status === "failed" || illustration?.status === "stale") && (
                    <span className="text-amber-600 font-semibold">
                      좌측 패널에서 &apos;현재 스타일로 일러스트 적용&apos;으로 재생성할 수 있습니다.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flow below illustration */}
          <div className="flex flex-col">
            <div
              className="mb-2 flex w-fit items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg text-white self-start"
              style={{ backgroundColor: flowHeaderColor }}
            >
              <h3 className="leading-none" style={titleStyle}>{flowSubTitle}</h3>
            </div>
            <div className="flex flex-col gap-2 px-1 py-1">
              {section.flow.length > 0 ? (
                section.flow.map((step, index) => (
                  <div
                    key={index}
                    className="px-2 py-2.5 rounded-md font-semibold break-keep text-xs"
                    style={{ ...flowItemStyle, textAlign }}
                  >
                    <EditableText
                      as="span"
                      value={step.text}
                      label={`내용 정리 ${index + 1} 수정`}
                      themeColor={flowHeaderColor}
                      maxLength={200}
                      onConfirm={(text) => handleFlowEdit(index, text)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4" style={{ fontFamily: fontCss }}>
                  내용 정리 데이터가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Two-column layout: standard mode (with or without illustration) */
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr] items-stretch overflow-hidden">
          {/* Left: Illustration or placeholder */}
          <div className="flex flex-col min-w-0">
            <div
              className="mb-2 flex w-fit items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg text-white self-start"
              style={{ backgroundColor: titleColor }}
            >
              <h3 className="leading-none" style={titleStyle}>{mainTitle}</h3>
            </div>
            <div className="overflow-hidden rounded-xl">
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={illustration!.imageUrl}
                  alt={`${section.passageId} visual summary`}
                  width={560}
                  height={220}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="block w-full max-h-55 rounded-xl object-contain"
                />
              ) : (
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-center text-xs text-gray-500">
                  <span>{statusLabel(illustration?.status)}: 일러스트 생성 후 여기에 표시됩니다.</span>
                  {(illustration?.status === "failed" || illustration?.status === "stale") && (
                    <span className="text-amber-600 font-semibold">
                      좌측 패널에서 &apos;현재 스타일로 일러스트 적용&apos;으로 재생성할 수 있습니다.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Flow */}
          <div className="flex flex-col">
            <div className="flex-1 flex flex-col">
              <div
                className="mb-2 flex w-fit items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg text-white self-start"
                style={{ backgroundColor: flowHeaderColor }}
              >
                <h3 className="leading-none" style={titleStyle}>{flowSubTitle}</h3>
              </div>
              <div className="flex-1 flex flex-col justify-evenly px-1 py-1 gap-2">
                {section.flow.length > 0 ? (
                  section.flow.map((step, index) => (
                    <div
                      key={index}
                      className="px-2 py-2.5 rounded-md font-semibold break-keep text-xs"
                      style={{ ...flowItemStyle, textAlign }}
                    >
                      <EditableText
                        as="span"
                        value={step.text}
                        label={`내용 정리 ${index + 1} 수정`}
                        themeColor={flowHeaderColor}
                        maxLength={200}
                        onConfirm={(text) => handleFlowEdit(index, text)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4" style={{ fontFamily: fontCss }}>
                    내용 정리 데이터가 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
