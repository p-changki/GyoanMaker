import { useCallback } from "react";
import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useSectionStyle } from "./useSectionStyle";
import { EditableText } from "../EditableText";
import { updateTopicText } from "@/lib/sectionUpdaters";

export function TopicSection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, titleWeight, textAlign } = useSectionStyle("topic");
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const customTitle = useTemplateSettingsStore((s) => s.sectionTitles);
  const sectionTitle = customTitle?.topic || "주제";
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;
  const updateSection = useHandoutStore((s) => s.updateSection);

  const handleEdit = useCallback(
    (field: "en" | "ko", value: string) => {
      updateSection(section.passageId, updateTopicText(section, field, value));
    },
    [section, updateSection],
  );

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
        <EditableText
          value={section.topic.en}
          label="주제문 (영어)"
          multiline
          themeColor={titleColor}
          onConfirm={(v) => handleEdit("en", v)}
          className="font-bold mb-1 leading-relaxed"
          style={{ fontSize: `${fontSizes.topicEn}pt`, fontFamily: fontCss, color: textColor, textAlign }}
          as="p"
        />
        <EditableText
          value={section.topic.ko}
          label="주제문 (한국어)"
          multiline
          themeColor={titleColor}
          onConfirm={(v) => handleEdit("ko", v)}
          className="font-medium tracking-tight"
          style={{ fontSize: `${fontSizes.topicKo}pt`, fontFamily: fontCss, color: textColor === "#111827" ? "#374151" : textColor, textAlign }}
          as="p"
        />
      </div>
    </div>
  );
}
