import { useCallback } from "react";
import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useSectionStyle } from "./useSectionStyle";
import { EditableText } from "../EditableText";
import { updateFlowText } from "@/lib/sectionUpdaters";

export function FlowSection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, sentenceBg, fontSizes, fontFamilyKo, titleWeight, textAlign } = useSectionStyle("flow");
  const fontCssKo = FONT_FAMILY_MAP[fontFamilyKo].css;
  const sectionTitle = useTemplateSettingsStore((s) => s.sectionTitles)?.flow || "내용 정리";
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;
  const itemBg = bgColor || `${sentenceBg}99`;
  const updateSection = useHandoutStore((s) => s.updateSection);

  const handleEdit = useCallback(
    (index: number, value: string) => {
      updateSection(section.passageId, updateFlowText(section, index, value));
    },
    [section, updateSection],
  );

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
        {section.flow.map((step, i) => (
          <EditableText
            key={`flow-${step.index}-${i}`}
            value={step.text}
            label={`내용 정리 #${i + 1}`}
            themeColor={titleColor}
            onConfirm={(v) => handleEdit(i, v)}
            className="px-3 py-2 rounded-md font-bold"
            style={{ backgroundColor: itemBg, fontSize: `${fontSizes.flowText}px`, fontFamily: fontCssKo, color: textColor, textAlign }}
            as="div"
          />
        ))}
      </div>
    </div>
  );
}
