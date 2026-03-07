import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useSectionStyle } from "./useSectionStyle";

export function TopicSection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, titleWeight } = useSectionStyle("topic");
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  return (
    <div style={bgColor ? { backgroundColor: bgColor, borderRadius: "8px", padding: "8px" } : undefined}>
      <div
        className="inline-flex items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
        style={{ backgroundColor: titleColor, boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
      >
        <h3
          className="text-white leading-none"
          style={{ fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.sectionTitle}px`, fontWeight: titleFontWeight }}
        >
          주제
        </h3>
      </div>
      <div className="pl-1">
        <p className="font-bold mb-1 leading-relaxed"
          style={{ fontSize: `${fontSizes.topicEn}pt`, fontFamily: fontCss, color: textColor }}
        >
          {section.topic.en}
        </p>
        <p className="font-medium tracking-tight"
          style={{ fontSize: `${fontSizes.topicKo}pt`, fontFamily: fontCss, color: textColor === "#111827" ? "#374151" : textColor }}
        >
          {section.topic.ko}
        </p>
      </div>
    </div>
  );
}
