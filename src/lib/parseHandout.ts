import {
  HandoutSection,
  SentencePair,
  VocabItem,
  VocabRelated,
} from "../types/handout";

const MAX_PARSE_TEXT_LENGTH = 50_000;

export function parseHandoutSection(
  passageId: string,
  text: string | undefined
): HandoutSection {
  // 과도한 입력으로 인한 Regex 성능 저하 방지
  const safeText = text?.slice(0, MAX_PARSE_TEXT_LENGTH);

  const defaultSection: HandoutSection = {
    passageId,
    sentences: [],
    topic: { en: "", ko: "" },
    summary: { en: "", ko: "" },
    flow: [],
    vocabulary: [],
    rawText: safeText || "",
    isParsed: false,
  };

  if (!safeText) return defaultSection;

  try {
    const section = { ...defaultSection };

    const sentenceSectionMatch = safeText.match(
      /1\. 문장별 구문 분석 및 해석[\s\S]*?(?=2\. 주제문|$)/
    );
    if (sentenceSectionMatch) {
      section.sentences = parseSentenceSection(sentenceSectionMatch[0]);
    }

    const topicSectionMatch = safeText.match(
      /2\. 주제문[\s\S]*?(?=3\. 본문 요약|$)/
    );
    if (topicSectionMatch) {
      const topicContent = topicSectionMatch[0];
      const enMatch = topicContent.match(/English:\s*(.+)/i);
      const koMatch = topicContent.match(/Korean:\s*(.+)/i);

      if (enMatch || koMatch) {
        if (enMatch) section.topic.en = normalizeInline(enMatch[1]);
        if (koMatch) section.topic.ko = normalizeInline(koMatch[1]);
      } else {
        const topicLines = topicContent
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .filter((line) => !/^2\.\s*주제문/.test(line));

        if (topicLines[0]) section.topic.en = normalizeInline(topicLines[0]);
        if (topicLines[1]) section.topic.ko = normalizeInline(topicLines[1]);
      }
    }

    const summarySectionMatch = safeText.match(
      /3\. 본문 요약[\s\S]*?(?=4\. 글의 흐름|$)/
    );
    if (summarySectionMatch) {
      const summaryContent = summarySectionMatch[0];
      const enMatch = summaryContent.match(
        /English:\s*([\s\S]*?)(?=Korean:|$)/i
      );
      const koMatch = summaryContent.match(/Korean:\s*([\s\S]*?)$/i);

      if (enMatch || koMatch) {
        if (enMatch) section.summary.en = normalizeInline(enMatch[1]);
        if (koMatch) section.summary.ko = normalizeInline(koMatch[1]);
      } else {
        const summaryLines = summaryContent
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .filter((line) => !/^3\.\s*본문 요약/.test(line));

        if (summaryLines[0])
          section.summary.en = normalizeInline(summaryLines[0]);
        if (summaryLines[1])
          section.summary.ko = normalizeInline(summaryLines[1]);
      }
    }

    const flowSectionMatch = safeText.match(
      /4\. 글의 흐름 4단 정리[\s\S]*?(?=5\. 핵심 어휘|$)/
    );
    if (flowSectionMatch) {
      const flowLines = flowSectionMatch[0]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => !/^4\.\s*글의 흐름/.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((line) => line.length > 0);

      section.flow = flowLines.map((line, index) => ({
        index: index + 1,
        text: line,
      }));
    }

    const vocabSectionMatch = safeText.match(/5\. 핵심 어휘 및 확장[\s\S]*$/);
    if (vocabSectionMatch) {
      section.vocabulary = parseVocabularySection(vocabSectionMatch[0]);
    }

    if (
      section.sentences.length > 0 ||
      section.topic.en ||
      section.vocabulary.length > 0
    ) {
      section.isParsed = true;
    }

    return section;
  } catch (error) {
    console.error(`Failed to parse section ${passageId}`, error);
    return defaultSection;
  }
}

function normalizeInline(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseSentenceSection(sentenceSection: string): SentencePair[] {
  const allLines = sentenceSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const contentLines = allLines.filter(
    (line) => !/^1\.\s*문장별 구문 분석 및 해석/.test(line)
  );

  if (contentLines.length === 0) {
    return [];
  }

  const englishMarkerIndex = contentLines.findIndex((line) =>
    /^영어\s*섹션/.test(line)
  );
  const koreanMarkerIndex = contentLines.findIndex((line) =>
    /^한글\s*섹션/.test(line)
  );

  let enLines: string[] = [];
  let koLines: string[] = [];

  if (
    englishMarkerIndex >= 0 &&
    koreanMarkerIndex >= 0 &&
    englishMarkerIndex < koreanMarkerIndex
  ) {
    enLines = contentLines.slice(englishMarkerIndex + 1, koreanMarkerIndex);
    koLines = contentLines.slice(koreanMarkerIndex + 1);
  } else {
    const firstKoreanIndex = contentLines.findIndex((line) =>
      isLikelyKorean(line)
    );
    const groupedByLanguage =
      firstKoreanIndex > 0 &&
      contentLines
        .slice(0, firstKoreanIndex)
        .every((line) => isLikelyEnglish(line)) &&
      contentLines
        .slice(firstKoreanIndex)
        .every((line) => isLikelyKorean(line));

    if (groupedByLanguage) {
      enLines = contentLines.slice(0, firstKoreanIndex);
      koLines = contentLines.slice(firstKoreanIndex);
    } else {
      for (let i = 0; i < contentLines.length; i += 2) {
        const enLine = contentLines[i];
        const koLine = contentLines[i + 1];
        if (enLine && koLine) {
          enLines.push(enLine);
          koLines.push(koLine);
        }
      }
    }
  }

  const pairCount = Math.min(enLines.length, koLines.length);
  const sentences: SentencePair[] = [];

  for (let i = 0; i < pairCount; i += 1) {
    const en = stripLeadingIndex(enLines[i]);
    const ko = stripLeadingIndex(koLines[i]);

    if (en && ko) {
      sentences.push({ en, ko });
    }
  }

  return sentences;
}

function isLikelyEnglish(line: string): boolean {
  return /[A-Za-z]/.test(line) && !/[가-힣]/.test(line);
}

function isLikelyKorean(line: string): boolean {
  return /[가-힣]/.test(line);
}

function stripLeadingIndex(line: string): string {
  return line
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳❶❷❸❹❺❻❼❽❾❿⓫⓬⓭⓮⓯⓰⓱⓲⓳⓴\s]+/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function parseVocabularySection(vocabSection: string): VocabItem[] {
  const lines = vocabSection
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^5\.\s*핵심 어휘 및 확장/.test(line));

  const vocabulary: VocabItem[] = [];
  let currentItem: VocabItem | null = null;
  let mode: "syn" | "ant" | null = null;

  for (const line of lines) {
    const synonymMatch = line.match(/^유의어(?:\(\d+\))?\s*:?(.*)$/);
    if (synonymMatch) {
      if (!currentItem) {
        continue;
      }

      mode = "syn";
      const entries = parseRelatedEntries(synonymMatch[1]);
      if (entries.length > 0) {
        currentItem.synonyms.push(...entries);
      }
      continue;
    }

    const antonymMatch = line.match(/^반의어(?:\(\d+\))?\s*:?(.*)$/);
    if (antonymMatch) {
      if (!currentItem) {
        continue;
      }

      mode = "ant";
      const entries = parseRelatedEntries(antonymMatch[1]);
      if (entries.length > 0) {
        currentItem.antonyms.push(...entries);
      }
      continue;
    }

    if (currentItem && mode && !/^\d+\./.test(line)) {
      const entries = parseRelatedEntries(line);
      if (entries.length > 0) {
        if (mode === "syn") {
          currentItem.synonyms.push(...entries);
        } else {
          currentItem.antonyms.push(...entries);
        }
      }
      continue;
    }

    const headEntry = parseVocabHeadLine(line, true);
    if (headEntry) {
      if (currentItem) {
        vocabulary.push(currentItem);
      }

      currentItem = {
        index: vocabulary.length + 1,
        word: headEntry.word,
        meaning: normalizeMeaning(headEntry.meaning),
        synonyms: [],
        antonyms: [],
      };
      mode = null;
      continue;
    }

    if (!currentItem) {
      continue;
    }

    const entries = parseRelatedEntries(line);
    if (entries.length === 0) {
      continue;
    }

    if (mode === "syn") {
      currentItem.synonyms.push(...entries);
    } else if (mode === "ant") {
      currentItem.antonyms.push(...entries);
    }
  }

  if (currentItem) {
    vocabulary.push(currentItem);
  }

  return vocabulary;
}

function parseVocabHeadLine(
  line: string,
  requireNumberPrefix = false
): { word: string; meaning: string } | null {
  if (requireNumberPrefix && !/^\d+\./.test(line)) {
    return null;
  }

  const body = line.replace(/^\d+\.\s*/, "").trim();
  if (!body) return null;
  if (/^(유의어|반의어)/.test(body)) return null;

  const parenMatch = body.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (parenMatch) {
    return {
      word: parenMatch[1].trim(),
      meaning: parenMatch[2].trim(),
    };
  }

  const plainMatch = body.match(/^([^\s()]+)\s+(.+)$/);
  if (plainMatch) {
    return {
      word: plainMatch[1].trim(),
      meaning: plainMatch[2].trim(),
    };
  }

  return null;
}

function parseRelatedEntries(raw: string): VocabRelated[] {
  const normalized = raw.trim();
  if (!normalized) return [];

  return normalized
    .split(/,\s*/)
    .map((part) => parseRelatedEntry(part.trim()))
    .filter((entry): entry is VocabRelated => entry !== null);
}

function parseRelatedEntry(entry: string): VocabRelated | null {
  if (!entry) return null;

  const parenMatch = entry.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (parenMatch) {
    return {
      word: parenMatch[1].trim(),
      meaning: normalizeMeaning(parenMatch[2].trim()),
    };
  }

  const plainMatch = entry.match(/^([^\s()]+)\s+(.+)$/);
  if (plainMatch) {
    return {
      word: plainMatch[1].trim(),
      meaning: normalizeMeaning(plainMatch[2].trim()),
    };
  }

  return null;
}

function normalizeMeaning(meaning: string): string {
  return meaning.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
}
