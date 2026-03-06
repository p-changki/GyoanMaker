import { PassageResult, CoreVocabItem, VocabRelated } from "@gyoanmaker/shared/types";

export type SectionKey =
  | "sentences"
  | "topic_sentence"
  | "summary"
  | "flow_4"
  | "core_vocab"
  | "all";

export function formatSectionText(
  result: PassageResult,
  section: SectionKey
): string {
  switch (section) {
    case "sentences":
      return formatSentences(result);
    case "topic_sentence":
      return formatTopicSentence(result);
    case "summary":
      return formatSummary(result);
    case "flow_4":
      return formatFlow4(result);
    case "core_vocab":
      return formatCoreVocab(result);
    case "all":
      return formatPassageText(result);
    default:
      return "";
  }
}

export function formatPassageText(result: PassageResult): string {
  const sections = [
    `【${result.passage_id}】`,
    formatSentences(result),
    formatTopicSentence(result),
    formatSummary(result),
    formatFlow4(result),
    formatCoreVocab(result),
  ];

  return sections.filter(Boolean).join("\n\n") + "\n";
}

function formatSentences(result: PassageResult): string {
  const header = "[문장별 구문 분석]";
  const enBlock = result.sentences.map((s) => s.en).join("\n");
  const koBlock = result.sentences.map((s) => s.ko).join("\n");
  const body = `영어 섹션\n${enBlock}\n한글 섹션\n${koBlock}`;
  return `${header}\n${body}`;
}

function formatTopicSentence(result: PassageResult): string {
  const header = "[주제문]";
  const body = `${result.topic_sentence.en}\n${result.topic_sentence.ko}`;
  return `${header}\n${body}`;
}

function formatSummary(result: PassageResult): string {
  const header = "[요약]";
  const enSummary = result.summary.en.join(" ");
  const koSummary = result.summary.ko.join(" ");
  const body = `${enSummary}\n${koSummary}`;
  return `${header}\n${body}`;
}

function formatFlow4(result: PassageResult): string {
  const header = "[글의 흐름 4단 정리]";
  const body = result.flow_4.map((item) => item.text).join("\n");
  return `${header}\n${body}`;
}

function formatCoreVocab(result: PassageResult): string {
  const header = "[핵심 어휘]";
  const body = result.core_vocab
    .map((item, index) => formatVocabItem(item, index + 1))
    .join("\n");
  return `${header}\n${body}`;
}

function formatVocabItem(item: CoreVocabItem, index: number): string {
  let text = `${index}. ${item.word} ${item.meaning_ko}`;

  if (item.synonyms.length > 0) {
    text += `\n유의어\n${formatRelatedList(item.synonyms)}`;
  }

  if (item.antonyms.length > 0) {
    text += `\n반의어\n${formatRelatedList(item.antonyms)}`;
  }

  return text;
}

function formatRelatedList(related: VocabRelated[]): string {
  return related.map((r) => `${r.word} ${r.meaning_ko}`).join("\n");
}
