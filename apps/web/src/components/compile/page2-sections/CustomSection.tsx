import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import type { CustomSectionKey } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useSectionStyle } from "./useSectionStyle";

export function CustomSection({ sectionKey }: { sectionKey: CustomSectionKey }) {
  const content = useTemplateSettingsStore((s) => s.customSections?.[sectionKey]);
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, titleWeight } = useSectionStyle(sectionKey);
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  if (!content) return null;

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
          {content.title}
        </h3>
      </div>
      {content.body && (
        <div className="pl-1">
          <p
            className="leading-relaxed whitespace-pre-wrap"
            style={{ fontSize: `${fontSizes.topicEn}pt`, fontFamily: fontCss, color: textColor }}
          >
            {content.body}
          </p>
        </div>
      )}
    </div>
  );
}
