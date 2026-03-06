import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";


export function SummarySection({ section }: { section: HandoutSection }) {
  const preset = useTemplateSettingsStore((s) => s.themePreset);
  const fontSizes = useTemplateSettingsStore((s) => s.fontSizes);
  const fontFamily = useTemplateSettingsStore((s) => s.fontFamily);
  const titleWeight = useTemplateSettingsStore((s) => s.titleWeight);
  const theme = THEME_PRESETS[preset];
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  if (!section.summary?.en) return null;

  return (
    <div>
      <div
        className="inline-flex items-center justify-center  px-4 pt-[5px] pb-[7px] rounded-lg mb-3"
        style={{ backgroundColor: theme.primary, boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
      >
        <h3
          className="text-white leading-none"
          style={{ fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.sectionTitle}px`, fontWeight: titleFontWeight }}
        >
          요약
        </h3>
      </div>
      <div className="pl-1">
        <p className="font-normal text-[#111827] mb-1 leading-relaxed"
                  style={{ fontSize: `${fontSizes.summaryEn}pt`, fontFamily: fontCss }}>
          {section.summary.en}
        </p>
        <p className="font-medium text-[#374151] tracking-tight"
                  style={{ fontSize: `${fontSizes.summaryKo}pt`, fontFamily: fontCss }}>
          {section.summary.ko}
        </p>
      </div>
    </div>
  );
}
