import type { HandoutSection } from "@gyoanmaker/shared/types";
import type { SlideConfig } from "../_hooks/useLectureSlideStore";

// 슬라이드 가용 높이 — LAYOUT_WIDE = 13.33" × 7.5", body start 0.9", bottom margin 0.5"
const SLIDE_BODY_H = 6.0;
// 단일행 높이 계산 (pt → inches, 줄간격 포함)
const lineHeightIn = (sizePt: number, leading: number) => (sizePt * leading) / 72;
// estimateLines: usePptxExport와 동일 로직 (보정계수 동기화 필수)
function estimateLines(text: string, widthIn: number, sizePt: number): number {
  const units = [...text].reduce(
    (sum, ch) => sum + (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch) ? 2.0 : 0.6),
    0
  );
  const unitsPerLine = (widthIn * 72) / sizePt;
  return Math.max(1, Math.ceil((units * 1.05) / unitsPerLine));
}
/** 문장 배열을 슬라이드 가용 높이 내에서 자동 분할한다 */
function splitSentencesToSlides(
  sentences: { index: number; en: string; ko: string }[],
  bodyFontSize: number,
  showKorean: boolean
): { index: number; en: string; ko: string }[][] {
  const enSingleH = lineHeightIn(bodyFontSize, 1.4);
  const koSingleH = lineHeightIn(bodyFontSize - 2, 1.3);
  const chunks: { index: number; en: string; ko: string }[][] = [];
  let current: { index: number; en: string; ko: string }[] = [];
  let usedH = 0;

  const EN_KO_GAP = 0.04;  // usePptxExport와 동기화
  const ITEM_GAP = 0.15;   // usePptxExport와 동기화

  for (const s of sentences) {
    const enLines = estimateLines(s.en, 12.0, bodyFontSize); // TEXT_W = 12.5 - 0.5(NUM_W) = 12.0"
    const koLines = showKorean ? estimateLines(s.ko, 12.0, bodyFontSize - 2) : 0;
    const itemH =
      enSingleH * enLines +
      EN_KO_GAP +
      (showKorean && s.ko ? koSingleH * koLines : 0) +
      ITEM_GAP;

    if (current.length > 0 && usedH + itemH > SLIDE_BODY_H) {
      chunks.push(current);
      current = [];
      usedH = 0;
    }
    current.push(s);
    usedH += itemH;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

export interface SlideData {
  type: "topic-summary" | "sentences" | "vocab";
  passageTitle: string; // e.g. "지문 1"
  passageIndex: number;
  // topic-summary
  topicEn?: string;
  topicKo?: string;
  summaryLines?: { en: string; ko: string }[];
  // sentences
  sentenceItems?: { index: number; en: string; ko: string }[];
  showKorean?: boolean;
  // vocab
  vocabItems?: {
    index: number;
    word: string;
    meaning: string;
    synonyms: string;
    antonyms: string;
  }[];
}

export function buildSlides(
  sections: HandoutSection[],
  config: SlideConfig,
  handoutTitle: string
): SlideData[] {
  const slides: SlideData[] = [];

  sections.forEach((section, passageIndex) => {
    const passageTitle =
      config.passTitles[passageIndex] ??
      `${handoutTitle} ${passageIndex + 1}번`;

    // ─── Slide: 주제 + 요약 ────────────────────────────────────────────────
    if (config.includeTopicSummary && section.isParsed) {
      const summaryLines: { en: string; ko: string }[] = [];
      if (section.summary.en) {
        const enSentences = section.summary.en
          .split(/(?<=[.!?])\s+/)
          .filter(Boolean);
        const koSentences = config.showKorean
          ? section.summary.ko.split(/(?<=[。.!?])\s+/).filter(Boolean)
          : [];
        const maxLen = Math.max(enSentences.length, koSentences.length);
        for (let i = 0; i < maxLen; i++) {
          summaryLines.push({
            en: enSentences[i] ?? "",
            ko: koSentences[i] ?? "",
          });
        }
      }

      slides.push({
        type: "topic-summary",
        passageTitle,
        passageIndex,
        topicEn: section.topic.en,
        topicKo: config.showKorean ? section.topic.ko : "",
        summaryLines,
      });
    }

    // ─── Slides: 문장 목록 (가용 높이 기준 자동 분할) ────────────────────
    if (config.includeSentences && section.isParsed && section.sentences.length > 0) {
      const allItems = section.sentences.map((s, j) => ({
        index: j + 1,
        en: s.en,
        ko: s.ko,
      }));
      const chunks = splitSentencesToSlides(
        allItems,
        config.bodyFontSize,
        config.showKorean
      );
      chunks.forEach((chunk) => {
        slides.push({
          type: "sentences",
          passageTitle,
          passageIndex,
          sentenceItems: chunk,
          showKorean: config.showKorean,
        });
      });
    }

    // ─── Slide: 핵심 어휘 표 ──────────────────────────────────────────────
    if (config.includeVocab && section.isParsed && section.vocabulary.length > 0) {
      slides.push({
        type: "vocab",
        passageTitle,
        passageIndex,
        vocabItems: section.vocabulary.map((v) => ({
          index: v.index,
          word: v.word,
          meaning: v.meaning,
          synonyms: v.synonyms.map((s) => `${s.word} (${s.meaning})`).join(", "),
          antonyms: v.antonyms.map((a) => `${a.word} (${a.meaning})`).join(", "),
        })),
      });
    }
  });

  return slides;
}
