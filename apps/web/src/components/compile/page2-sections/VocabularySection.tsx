import type { HandoutSection } from "@gyoanmaker/shared/types/handout";
import { THEME_PRESETS, FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";


export function VocabularySection({ section }: { section: HandoutSection }) {
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
          핵심 어휘
        </h3>
      </div>

      <table className="w-full text-left border-collapse border-t-[3px] border-b-[3px]" style={{ borderColor: theme.primary }}>
        <thead>
          <tr
            className="text-white"
            style={{ backgroundColor: theme.primary, fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.vocabText}px`, fontWeight: titleFontWeight }}
          >
            <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">핵심 어휘</th>
            <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">뜻</th>
            <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">유의어</th>
            <th className="px-3 py-2 w-[25%]">반의어</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {section.vocabulary
            .filter((vocab) => vocab.word !== "핵심 어휘 및 확장")
            .map((vocab, index) => (
              <tr
                key={`${vocab.word}-${vocab.meaning}`}
                className={`border-b border-current/20 ${index % 2 === 1 ? "bg-[#F9FAFB]/50" : ""}`}
                style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss }}
              >
                <td className="px-3 py-2 text-[#111827] font-bold border-r border-current/20">
                  {vocab.word}
                </td>
                <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-current/20">
                  {vocab.meaning}
                </td>
                <td className="px-3 py-2 text-[#4B5563] border-r border-current/20 align-middle font-normal">
                  {vocab.synonyms.length > 0
                    ? vocab.synonyms.map((s) => (
                        <div
                          key={`syn-${vocab.word}-${s.word}-${s.meaning}`}
                          className="mb-1 last:mb-0"
                        >
                          {s.word} {s.meaning}
                        </div>
                      ))
                    : "-"}
                </td>
                <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
                  {vocab.antonyms.length > 0
                    ? vocab.antonyms.map((a) => (
                        <div
                          key={`ant-${vocab.word}-${a.word}-${a.meaning}`}
                          className="mb-1 last:mb-0"
                        >
                          {a.word} {a.meaning}
                        </div>
                      ))
                    : "-"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
