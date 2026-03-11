import { useCallback } from "react";
import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useSectionStyle } from "./useSectionStyle";
import { EditableText } from "../EditableText";
import { updateSummaryText } from "@/lib/sectionUpdaters";

export function SummarySection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, fontFamilyKo, titleWeight, textAlign } = useSectionStyle("summary");
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const fontCssKo = FONT_FAMILY_MAP[fontFamilyKo].css;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;
  const summaryLanguage = useTemplateSettingsStore((s) => s.summaryLanguage) ?? "both";
  const sectionTitle = useTemplateSettingsStore((s) => s.sectionTitles)?.summary || "요약";
  const updateSection = useHandoutStore((s) => s.updateSection);

  const handleEdit = useCallback(
    (field: "en" | "ko", value: string) => {
      updateSection(section.passageId, updateSummaryText(section, field, value));
    },
    [section, updateSection],
  );

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
          <EditableText
            value={section.summary.en}
            label="요약 (영어)"
            multiline
            themeColor={titleColor}
            onConfirm={(v) => handleEdit("en", v)}
            className="font-normal mb-1 leading-relaxed"
            style={{ fontSize: `${fontSizes.summaryEn}pt`, fontFamily: fontCss, color: textColor, textAlign }}
            as="p"
          />
        )}
        {showKo && (
          <EditableText
            value={section.summary.ko}
            label="요약 (한국어)"
            multiline
            themeColor={titleColor}
            onConfirm={(v) => handleEdit("ko", v)}
            className="font-medium tracking-tight"
            style={{ fontSize: `${fontSizes.summaryKo}pt`, fontFamily: fontCssKo, color: textColor === "#111827" ? "#374151" : textColor, textAlign }}
            as="p"
          />
        )}
      </div>
    </div>
  );
}
