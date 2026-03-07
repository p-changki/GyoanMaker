import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";


export function TopicSection({ section }: { section: HandoutSection }) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const theme = THEME_PRESETS[preset];
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  return (
    <div>
      <div
        className="inline-flex items-center justify-center px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
        style={{ backgroundColor: theme.primary, boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
      >
        <h3
          className="text-white leading-none"
          style={{ fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.sectionTitle}px`, fontWeight: titleFontWeight }}
        >
          주제
        </h3>
      </div>
      <div className="pl-1">
        <p className="font-bold text-[#111827] mb-1 leading-relaxed"
                  style={{ fontSize: `${fontSizes.topicEn}pt`, fontFamily: fontCss }}>
          {section.topic.en}
        </p>
        <p className="font-medium text-[#374151] tracking-tight"
                  style={{ fontSize: `${fontSizes.topicKo}pt`, fontFamily: fontCss }}>
          {section.topic.ko}
        </p>
      </div>
    </div>
  );
}
