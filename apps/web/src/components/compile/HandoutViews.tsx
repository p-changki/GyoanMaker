"use client";

import { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { EditableAnalysisTitle, EditableSummaryTitleText } from "./EditableFields";
import { HandoutFooter, HandoutHeader } from "./HandoutHeader";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { SECTION_COMPONENTS } from "./page2-sections";

function useTheme() {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  return {
    ...THEME_PRESETS[preset],
    fontSizes,
    fontCss: FONT_FAMILY_MAP[fontFamily].css,
    titleFontWeight: TITLE_WEIGHT_MAP[titleWeight].value,
  };
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

  return (
    <div className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative">
      <HandoutHeader section={section} pageNum={pageNum} />

      <section className="mb-8 relative flex-1 w-full">
        <div
          className="inline-flex items-center justify-center bg-white text-sm font-bold px-3 py-1.5 border rounded-full mb-3 z-10 relative leading-none"
          style={{ color: theme.primary, borderColor: theme.primary }}
        >
          <span className="translate-y-px">
            <EditableAnalysisTitle pageNum={pageNum} />
          </span>
        </div>

        <div
          className="border-t-[3px] border-b-[3px] w-full"
          style={{ borderColor: theme.primary }}
        >
          <div className="flex relative w-full">
            <div
              className="absolute top-0 right-0 w-[35%] h-full"
              style={{ backgroundColor: `${theme.sentenceBg}80` }}
            />

            <div className="flex flex-col w-full relative z-10 divide-y divide-[#E5E7EB]">
              {sentencesChunk.map((pair, i) => (
                <div key={`${pair.en}-${pair.ko}-${i}`} className="flex min-h-[60px] w-full">
                  <div className="w-[65%] flex py-4 pr-6">
                    <div
                      className="w-8 shrink-0 font-black pt-0.5"
                      style={{ color: theme.primary, fontSize: `${theme.fontSizes.sentenceNumber}px` }}
                    >
                      {String((pageNum - 1) * 10 + i + 1).padStart(2, "0")}
                    </div>
                    <div
                      className="flex-1 font-normal text-[#111827] leading-[2.1]"
                      style={{
                        fontSize: `${theme.fontSizes.analysisEn}pt`,
                        fontFamily: theme.fontCss,
                      }}
                    >
                      {pair.en.replace(
                        /^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/,
                        ""
                      )}
                    </div>
                  </div>

                  <div className="w-[35%] py-4 pl-6 pr-4">
                    <div
                      className="font-normal text-[#1F2937] leading-[2.1]"
                      style={{
                        fontSize: `${theme.fontSizes.analysisKo}pt`,
                        fontFamily: theme.fontCss,
                      }}
                    >
                      {pair.ko.replace(
                        /^[\u2460-\u2473\u2776-\u277F\u24EB-\u24FE\s]+/,
                        ""
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
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

  return (
    <div className="p-8 md:p-12 xl:p-16 flex flex-col h-full bg-white relative">
      <section className="mb-14 relative flex-1 w-full">
        <div
          className="relative mb-10 h-12 rounded-r-xl flex items-center pr-10 w-[95%] mt-6"
          style={{
            backgroundColor: theme.primary,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          }}
        >
          <div className="absolute -top-[40px] left-6 w-[90px] h-[90px] z-20">
            {/* eslint-disable-next-line @next/next/no-img-element -- PDF canvas preview */}
            <img
              src={avatarBase64 ?? "/images/avatar.png"}
              alt="Teacher Avatar"
              className="w-full h-full object-contain"
              style={{
                filter:
                  "drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))",
              }}
            />
          </div>
          <span
            className="text-white tracking-wide ml-32 z-30"
            style={{ fontFamily: "GmarketSans, sans-serif", fontWeight: theme.titleFontWeight, fontSize: `${theme.fontSizes.summaryBarTitle}px` }}
          >
            <EditableSummaryTitleText />
          </span>
        </div>

        <div className="space-y-8 pl-2">
          {page2Sections.map((key) => {
            const Component = SECTION_COMPONENTS[key];
            return <Component key={key} section={section} />;
          })}
        </div>
      </section>

      <HandoutFooter section={section} pageNum={pageNum} />
    </div>
  );
}
