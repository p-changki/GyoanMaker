import {
  HandoutSection,
  SentencePair,
  VocabItem,
  VocabRelated,
} from "../types/handout";

/**
 * AI 응답 텍스트(PlainText)를 각 섹션별로 파싱하여 구조화된 객체로 반환한다.
 */
export function parseHandoutSection(
  passageId: string,
  text: string | undefined
): HandoutSection {
  const defaultSection: HandoutSection = {
    passageId,
    sentences: [],
    topic: { en: "", ko: "" },
    summary: { en: "", ko: "" },
    flow: [],
    vocabulary: [],
    rawText: text || "",
    isParsed: false,
  };

  if (!text) return defaultSection;

  try {
    const section = { ...defaultSection };

    // 1. 문장별 분석 파싱 (1. 문장별 구문 분석 및 해석)
    const sentenceSectionMatch = text.match(
      /1\. 문장별 구문 분석 및 해석[\s\S]*?(?=2\. 주제문|$)/
    );
    if (sentenceSectionMatch) {
      const lines = sentenceSectionMatch[0]
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .slice(1);
      const sentences: SentencePair[] = [];
      for (let i = 0; i < lines.length; i += 2) {
        if (lines[i] && lines[i + 1]) {
          sentences.push({ en: lines[i].trim(), ko: lines[i + 1].trim() });
        }
      }
      section.sentences = sentences;
    }

    // 2. 주제문 파싱 (2. 주제문)
    const topicSectionMatch = text.match(
      /2\. 주제문[\s\S]*?(?=3\. 본문 요약|$)/
    );
    if (topicSectionMatch) {
      const topicContent = topicSectionMatch[0];
      const enMatch = topicContent.match(/English:\s*(.+)/i);
      const koMatch = topicContent.match(/Korean:\s*(.+)/i);
      if (enMatch) section.topic.en = enMatch[1].trim();
      if (koMatch) section.topic.ko = koMatch[1].trim();
    }

    // 3. 본문 요약 파싱 (3. 본문 요약)
    const summarySectionMatch = text.match(
      /3\. 본문 요약[\s\S]*?(?=4\. 글의 흐름|$)/
    );
    if (summarySectionMatch) {
      const summaryContent = summarySectionMatch[0];
      const enMatch = summaryContent.match(
        /English:\s*([\s\S]*?)(?=Korean:|$)/i
      );
      const koMatch = summaryContent.match(/Korean:\s*([\s\S]*?)$/i);
      if (enMatch) section.summary.en = enMatch[1].trim();
      if (koMatch) section.summary.ko = koMatch[1].trim();
    }

    // 4. 글의 흐름 파싱 (4. 글의 흐름 4단 정리)
    const flowSectionMatch = text.match(
      /4\. 글의 흐름 4단 정리[\s\S]*?(?=5\. 핵심 어휘|$)/
    );
    if (flowSectionMatch) {
      const flowLines = flowSectionMatch[0]
        .split("\n")
        .filter((l) => /^\d+\./.test(l.trim()))
        .map((l) => l.trim());

      section.flow = flowLines.map((line) => {
        const parts = line.match(/^(\d+)\.\s*(.+)$/);
        return {
          index: parts ? parseInt(parts[1]) : 0,
          text: parts ? parts[2].trim() : line,
        };
      });
    }

    // 5. 핵심 어휘 파싱 (5. 핵심 어휘 및 확장)
    const vocabSectionMatch = text.match(/5\. 핵심 어휘 및 확장[\s\S]*$/);
    if (vocabSectionMatch) {
      const vocabBlocks = vocabSectionMatch[0].split(/\n(?=\d+\.)/);
      const vocabulary: VocabItem[] = [];

      for (const block of vocabBlocks) {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        const mainLine = lines.find((l) => /^\d+\./.test(l));
        if (!mainLine) continue;

        if (/^\d+\.\s*핵심 어휘 및 확장/.test(mainLine)) continue;

        // 1. homeostatsis (항상성) 혹은 1. homeostatsis(항상성) 모두 대응
        const mainParts = mainLine.match(/^\d+\.\s*(.*?)[\s]*\((.*?)\)$/);

        if (!mainParts) {
          continue;
        }

        const item: VocabItem = {
          index: vocabulary.length + 1,
          word: mainParts[1].trim(),
          meaning: mainParts[2].trim(),
          synonyms: [],
          antonyms: [],
        };

        const synLine = lines.find((l) => l.includes("유의어"));
        if (synLine) {
          const synString = synLine.replace(/유의어\(\d+\):\s*/, "");
          item.synonyms = parseVocabList(synString);
        }

        const antLine = lines.find((l) => l.includes("반의어"));
        if (antLine) {
          const antString = antLine.replace(/반의어\(\d+\):\s*/, "");
          item.antonyms = parseVocabList(antString);
        }

        vocabulary.push(item);
      }
      section.vocabulary = vocabulary;
    }

    // 파싱 성공 조건: 주요 섹션 중 하나라도 채워졌으면 true
    if (
      section.sentences.length > 0 ||
      section.topic.en ||
      section.vocabulary.length > 0
    ) {
      section.isParsed = true;
    }

    return section;
  } catch (e) {
    console.error(`Failed to parse section ${passageId}`, e);
    return defaultSection;
  }
}

/**
 * "단어 (뜻), 단어 (뜻)" 형태의 문자열을 VocabRelated 배열로 변환
 */
function parseVocabList(str: string): VocabRelated[] {
  return str
    .split(/,\s*/)
    .map((part) => {
      const match = part.match(/(.+?)\s*\((.+?)\)/);
      if (match) {
        return { word: match[1].trim(), meaning: match[2].trim() };
      }
      return { word: part.trim(), meaning: "" };
    })
    .filter((v) => v.word.length > 0 && v.meaning.length > 0);
}
