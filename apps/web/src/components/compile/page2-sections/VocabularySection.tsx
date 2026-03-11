import { useCallback } from "react";
import type { HandoutSection, VocabItem } from "@gyoanmaker/shared/types/handout";
import type { FontSizeConfig } from "@gyoanmaker/shared/types";
import { FONT_FAMILY_MAP, TITLE_WEIGHT_MAP } from "@gyoanmaker/shared/types";
import { useTemplateSettingsStore } from "@/stores/useTemplateSettingsStore";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { useSectionStyle } from "./useSectionStyle";
import { EditableText } from "../EditableText";
import { updateVocabField, updateVocabRelated } from "@/lib/sectionUpdaters";

/* ─── Shared vocab editing helpers ─── */

interface VocabEditProps {
  section: HandoutSection;
  vocabIndex: number;
  titleColor: string;
}

function useVocabEdit({ section, vocabIndex }: Omit<VocabEditProps, "titleColor">) {
  const updateSection = useHandoutStore((s) => s.updateSection);

  const editField = useCallback(
    (field: "word" | "meaning", value: string) => {
      updateSection(section.passageId, updateVocabField(section, vocabIndex, field, value));
    },
    [section, vocabIndex, updateSection],
  );

  const editRelated = useCallback(
    (type: "synonyms" | "antonyms", ri: number, value: string) => {
      const parts = value.split(/\s+/);
      const word = parts[0] ?? "";
      const meaning = parts.slice(1).join(" ");
      const step1 = updateVocabRelated(section, vocabIndex, type, ri, "word", word);
      const step2 = updateVocabRelated(step1, vocabIndex, type, ri, "meaning", meaning);
      updateSection(section.passageId, step2);
    },
    [section, vocabIndex, updateSection],
  );

  return { editField, editRelated };
}

/* ─── 4-Column Row ─── */

function VocabRow4({
  vocab,
  vocabIndex,
  fontSizes,
  fontCss,
  fontCssKo,
  textColor,
  titleColor,
  showSynonyms,
  showAntonyms,
  section,
}: {
  vocab: VocabItem;
  vocabIndex: number;
  fontSizes: FontSizeConfig;
  fontCss: string;
  fontCssKo: string;
  textColor: string;
  titleColor: string;
  showSynonyms: boolean;
  showAntonyms: boolean;
  section: HandoutSection;
}) {
  const { editField, editRelated } = useVocabEdit({ section, vocabIndex });

  return (
    <tr
      className="border-b border-current/20"
      style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss, color: textColor }}
    >
      <td className="px-3 py-2 text-[#111827] font-bold border-r border-current/20">
        <EditableText value={vocab.word} label="어휘" themeColor={titleColor} onConfirm={(v) => editField("word", v)} />
      </td>
      <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-current/20" style={{ fontFamily: fontCssKo }}>
        <EditableText value={vocab.meaning} label="뜻" themeColor={titleColor} onConfirm={(v) => editField("meaning", v)} />
      </td>
      {showSynonyms && (
        <td className="px-3 py-2 text-[#4B5563] border-r border-current/20 align-middle font-normal">
          {vocab.synonyms.length > 0
            ? vocab.synonyms.map((s, ri) => (
                <EditableText
                  key={`syn-${vocab.word}-${ri}`}
                  value={`${s.word} ${s.meaning}`}
                  label={`유의어 #${ri + 1}`}
                  themeColor={titleColor}
                  onConfirm={(v) => editRelated("synonyms", ri, v)}
                  className="mb-1 last:mb-0"
                  as="div"
                />
              ))
            : "-"}
        </td>
      )}
      {showAntonyms && (
        <td className="px-3 py-2 text-[#4B5563] align-middle font-normal">
          {vocab.antonyms.length > 0
            ? vocab.antonyms.map((a, ri) => (
                <EditableText
                  key={`ant-${vocab.word}-${ri}`}
                  value={`${a.word} ${a.meaning}`}
                  label={`반의어 #${ri + 1}`}
                  themeColor={titleColor}
                  onConfirm={(v) => editRelated("antonyms", ri, v)}
                  className="mb-1 last:mb-0"
                  as="div"
                />
              ))
            : "-"}
        </td>
      )}
    </tr>
  );
}

/* ─── 3-Column Row ─── */

function VocabRow3({
  vocab,
  vocabIndex,
  fontSizes,
  fontCss,
  fontCssKo,
  textColor,
  titleColor,
  section,
}: {
  vocab: VocabItem;
  vocabIndex: number;
  fontSizes: FontSizeConfig;
  fontCss: string;
  fontCssKo: string;
  textColor: string;
  titleColor: string;
  section: HandoutSection;
}) {
  const { editField } = useVocabEdit({ section, vocabIndex });

  const related = [
    ...vocab.synonyms.map((s) => `${s.word} ${s.meaning}`),
    ...vocab.antonyms.map((a) => `${a.word} ${a.meaning}`),
  ];
  return (
    <tr
      className="border-b border-current/20"
      style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss, color: textColor }}
    >
      <td className="px-3 py-2 text-[#111827] font-bold border-r border-current/20 w-[25%]">
        <EditableText value={vocab.word} label="어휘" themeColor={titleColor} onConfirm={(v) => editField("word", v)} />
      </td>
      <td className="px-3 py-2 text-[#1F2937] font-medium border-r border-current/20 w-[30%]" style={{ fontFamily: fontCssKo }}>
        <EditableText value={vocab.meaning} label="뜻" themeColor={titleColor} onConfirm={(v) => editField("meaning", v)} />
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

/* ─── 2-Column Row ─── */

function VocabRow2({
  vocab,
  vocabIndex,
  fontSizes,
  fontCss,
  fontCssKo,
  textColor,
  titleColor,
  section,
}: {
  vocab: VocabItem;
  vocabIndex: number;
  fontSizes: FontSizeConfig;
  fontCss: string;
  fontCssKo: string;
  textColor: string;
  titleColor: string;
  section: HandoutSection;
}) {
  const { editField } = useVocabEdit({ section, vocabIndex });

  const related = [
    ...vocab.synonyms.map((s) => `${s.word} ${s.meaning}`),
    ...vocab.antonyms.map((a) => `${a.word} ${a.meaning}`),
  ];
  return (
    <tr
      className="border-b border-current/20"
      style={{ fontSize: `${fontSizes.vocabText}px`, fontFamily: fontCss, color: textColor }}
    >
      <td className="px-3 py-2 font-bold text-[#111827] border-r border-current/20 w-[40%]">
        <EditableText value={vocab.word} label="어휘" themeColor={titleColor} onConfirm={(v) => editField("word", v)} as="span" className="font-bold" />{" "}
        <EditableText value={vocab.meaning} label="뜻" themeColor={titleColor} onConfirm={(v) => editField("meaning", v)} as="span" className="font-normal text-[#1F2937]" style={{ fontFamily: fontCssKo }} />
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

/* ─── Main Section ─── */

export function VocabularySection({ section }: { section: HandoutSection }) {
  const { titleColor, bgColor, textColor, theme, fontSizes, fontFamily, fontFamilyKo, titleWeight } = useSectionStyle("vocabulary");
  const headerBgColor = theme.primaryDark || titleColor;
  const vocabColumnLayout = useTemplateSettingsStore((s) => s.vocabColumnLayout) ?? 4;
  const vocabDisplay = useTemplateSettingsStore((s) => s.vocabDisplay);
  const showSynonyms = vocabDisplay?.showSynonyms ?? true;
  const showAntonyms = vocabDisplay?.showAntonyms ?? true;
  const fontCss = FONT_FAMILY_MAP[fontFamily].css;
  const fontCssKo = FONT_FAMILY_MAP[fontFamilyKo].css;
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
            style={{ backgroundColor: headerBgColor, fontFamily: "GmarketSans, sans-serif", fontSize: `${fontSizes.vocabText}px`, fontWeight: titleFontWeight }}
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
          {filteredVocab.map((vocab, idx) => {
            // Find original index in section.vocabulary for updater
            const vocabIndex = section.vocabulary.indexOf(vocab);
            if (vocabColumnLayout === 4) {
              return (
                <VocabRow4
                  key={`${vocab.word}-${vocab.meaning}-${idx}`}
                  vocab={vocab}
                  vocabIndex={vocabIndex}
                  fontSizes={fontSizes}
                  fontCss={fontCss}
                  fontCssKo={fontCssKo}
                  textColor={textColor}
                  titleColor={titleColor}
                  showSynonyms={showSynonyms}
                  showAntonyms={showAntonyms}
                  section={section}
                />
              );
            }
            if (vocabColumnLayout === 3) {
              return (
                <VocabRow3
                  key={`${vocab.word}-${vocab.meaning}-${idx}`}
                  vocab={vocab}
                  vocabIndex={vocabIndex}
                  fontSizes={fontSizes}
                  fontCss={fontCss}
                  fontCssKo={fontCssKo}
                  textColor={textColor}
                  titleColor={titleColor}
                  section={section}
                />
              );
            }
            return (
              <VocabRow2
                key={`${vocab.word}-${vocab.meaning}-${idx}`}
                vocab={vocab}
                vocabIndex={vocabIndex}
                fontSizes={fontSizes}
                fontCss={fontCss}
                fontCssKo={fontCssKo}
                textColor={textColor}
                titleColor={titleColor}
                section={section}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
