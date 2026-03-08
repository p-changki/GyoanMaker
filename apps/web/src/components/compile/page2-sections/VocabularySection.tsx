import type { HandoutSection, VocabItem } from "@gyoanmaker/shared/types/handout";
import type { FontSizeConfig } from "@gyoanmaker/shared/types";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useSectionStyle } from "./useSectionStyle";

function VocabRow4({
  vocab,
  index,
  fontSizes,
  fontCss,
  textColor,
  showSynonyms,
  showAntonyms,
}: {
  vocab: VocabItem;
  index: number;
  fontSizes: FontSizeConfig;
  fontCss: string;
  textColor: string;
  showSynonyms: boolean;
  showAntonyms: boolean;
}) {
  return (
    <tr
      className={`border-b border-current/20 ${index % 2 === 1 ? "bg-[#F9FAFB]/50" : ""}`}
      style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss, color: textColor }}
    >
      <td className="px-3 py-2 text-[#111827] font-bold border-r border-current/20">
        {vocab.word}
      </td>
      <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-current/20">
        {vocab.meaning}
      </td>
      {showSynonyms && (
        <td className="px-3 py-2 text-[#4B5563] border-r border-current/20 align-middle font-normal">
          {vocab.synonyms.length > 0
            ? vocab.synonyms.map((s) => (
                <div key={`syn-${vocab.word}-${s.word}-${s.meaning}`} className="mb-1 last:mb-0">
                  {s.word} {s.meaning}
                </div>
              ))
            : "-"}
        </td>
      )}
      {showAntonyms && (
        <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
          {vocab.antonyms.length > 0
            ? vocab.antonyms.map((a) => (
                <div key={`ant-${vocab.word}-${a.word}-${a.meaning}`} className="mb-1 last:mb-0">
                  {a.word} {a.meaning}
                </div>
              ))
            : "-"}
        </td>
      )}
    </tr>
  );
}

function VocabRow3({
  vocab,
  index,
  fontSizes,
  fontCss,
  textColor,
}: {
  vocab: VocabItem;
  index: number;
  fontSizes: FontSizeConfig;
  fontCss: string;
  textColor: string;
}) {
  const related = [
    ...vocab.synonyms.map((s) => `${s.word} ${s.meaning}`),
    ...vocab.antonyms.map((a) => `${a.word} ${a.meaning}`),
  ];
  return (
    <tr
      className={`border-b border-current/20 ${index % 2 === 1 ? "bg-[#F9FAFB]/50" : ""}`}
      style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss, color: textColor }}
    >
      <td className="px-3 py-2 text-[#111827] font-bold border-r border-current/20 w-[25%]">
        {vocab.word}
      </td>
      <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-current/20 w-[30%]">
        {vocab.meaning}
      </td>
      <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
        {related.length > 0
          ? related.map((r, i) => (
              <div key={i} className="mb-1 last:mb-0">
                {r}
              </div>
            ))
          : "-"}
      </td>
    </tr>
  );
}

function VocabRow2({
  vocab,
  index,
  fontSizes,
  fontCss,
  textColor,
}: {
  vocab: VocabItem;
  index: number;
  fontSizes: FontSizeConfig;
  fontCss: string;
  textColor: string;
}) {
  const related = [
    ...vocab.synonyms.map((s) => `${s.word} ${s.meaning}`),
    ...vocab.antonyms.map((a) => `${a.word} ${a.meaning}`),
  ];
  return (
    <tr
      className={`border-b border-current/20 ${index % 2 === 1 ? "bg-[#F9FAFB]/50" : ""}`}
      style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss, color: textColor }}
    >
      <td className="px-3 py-2 font-bold text-[#111827] border-r border-current/20 w-[40%]">
        <span className="font-bold">{vocab.word}</span>{" "}
        <span className="font-normal text-[#1F2937]">{vocab.meaning}</span>
      </td>
      <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
        {related.length > 0
          ? related.map((r, i) => (
              <div key={i} className="mb-1 last:mb-0">
                {r}
              </div>
            ))
          : "-"}
      </td>
    </tr>
  );
}

export function VocabularySection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, fontSizes, fontFamily, titleWeight } = useSectionStyle("vocabulary");
  const vocabColumnLayout = useTemplateSettingsStore((s) => s.vocabColumnLayout) ?? 4;
  const vocabDisplay = useTemplateSettingsStore((s) => s.vocabDisplay);
  const showSynonyms = vocabDisplay?.showSynonyms ?? true;
  const showAntonyms = vocabDisplay?.showAntonyms ?? true;
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const sectionTitle = useTemplateSettingsStore((s) => s.sectionTitles)?.vocabulary || "핵심 어휘";
  const titleFontWeight = TITLE_WEIGHT_MAP[titleWeight].value;

  const filteredVocab = section.vocabulary.filter((vocab) => vocab.word !== "핵심 어휘 및 확장");

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

      <table
        className="w-full text-left border-collapse border-t-[3px] border-b-[3px]"
        style={{ borderColor: titleColor }}
      >
        <thead>
          <tr
            className="text-white"
            style={{ backgroundColor: titleColor, fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.vocabText}px`, fontWeight: titleFontWeight }}
          >
            {vocabColumnLayout === 4 && (
              <>
                <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">핵심 어휘</th>
                <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">뜻</th>
                {showSynonyms && <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">유의어</th>}
                {showAntonyms && <th className="px-3 py-2 w-[25%]">반의어</th>}
              </>
            )}
            {vocabColumnLayout === 3 && (
              <>
                <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[25%]">핵심 어휘</th>
                <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[30%]">뜻</th>
                <th className="px-3 py-2">유의어 / 반의어</th>
              </>
            )}
            {vocabColumnLayout === 2 && (
              <>
                <th className="px-3 py-2 border-r border-[#ffffff]/20 w-[40%]">어휘 / 뜻</th>
                <th className="px-3 py-2">유의어 / 반의어</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white">
          {filteredVocab.map((vocab, index) => {
            if (vocabColumnLayout === 4) {
              return (
                <VocabRow4
                  key={`${vocab.word}-${vocab.meaning}`}
                  vocab={vocab}
                  index={index}
                  fontSizes={fontSizes}
                  fontCss={fontCss}
                  textColor={textColor}
                  showSynonyms={showSynonyms}
                  showAntonyms={showAntonyms}
                />
              );
            }
            if (vocabColumnLayout === 3) {
              return (
                <VocabRow3
                  key={`${vocab.word}-${vocab.meaning}`}
                  vocab={vocab}
                  index={index}
                  fontSizes={fontSizes}
                  fontCss={fontCss}
                  textColor={textColor}
                />
              );
            }
            return (
              <VocabRow2
                key={`${vocab.word}-${vocab.meaning}`}
                vocab={vocab}
                index={index}
                fontSizes={fontSizes}
                fontCss={fontCss}
                textColor={textColor}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
