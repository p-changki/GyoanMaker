import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useSectionStyle } from "./useSectionStyle";

export function FlowSection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, sentenceBg, fontSizes, fontFamily, titleWeight } = useSectionStyle("flow");
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const sectionTitle = useTemplateSettingsStore((s) => s.sectionTitles)?.flow || "내용 정리";
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;
  const itemBg = bgColor || `${sentenceBg}99`;

  return (
    <div>
      <div
        className="inline-flex items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
        style={{ backgroundColor: titleColor, boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
      >
        <h3
          className="text-white leading-none"
          style={{ fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.sectionTitle}px`, fontWeight: titleFontWeight }}
        >
          {sectionTitle}
        </h3>
      </div>
      <div className="pl-1 space-y-2">
        {section.flow.map((step) => (
          <div
            key={step.text}
            className="px-3 py-2 rounded-md font-bold text-center"
            style={{ backgroundColor: itemBg, fontSize: `${fontSizes.flowText}px`, fontFamily: fontCss, color: textColor }}
          >
            {step.text}
          </div>
        ))}
      </div>
    </div>
  );
}
