import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useSectionStyle } from "./useSectionStyle";

export function SummarySection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, titleWeight } = useSectionStyle("summary");
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;
  const summaryLanguage = useTemplateSettingsStore((s) => s.summaryLanguage) ?? "both";
  const sectionTitle = useTemplateSettingsStore((s) => s.sectionTitles)?.summary || "요약";

  if (!section.summary?.en) return null;

  const showEn = summaryLanguage === "both" || summaryLanguage === "en";
  const showKo = summaryLanguage === "both" || summaryLanguage === "ko";

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
          {sectionTitle}
        </h3>
      </div>
      <div className="pl-1">
        {showEn && (
          <p className="font-normal mb-1 leading-relaxed"
            style={{ fontSize: `${fontSizes.summaryEn}pt`, fontFamily: fontCss, color: textColor }}
          >
            {section.summary.en}
          </p>
        )}
        {showKo && (
          <p className="font-medium tracking-tight"
            style={{ fontSize: `${fontSizes.summaryKo}pt`, fontFamily: fontCss, color: textColor === "#111827" ? "#374151" : textColor }}
          >
            {section.summary.ko}
          </p>
        )}
      </div>
    </div>
  );
}
