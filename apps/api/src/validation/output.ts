function countWords(text: string): number {
  if (!text) return 0;
  let normalized = text.replace(/[–—]/g, "-").replace(/[‘’]/g, "'");
  normalized = normalized.replace(/[^A-Za-z0-9\s-']/g, " ");
  const tokens = normalized.trim().split(/\s+/).filter(Boolean);
  const validWords = tokens.filter((token) => /[A-Za-z0-9]/.test(token));
  return validWords.length;
}

function splitSentences(summaryEn: string): string[] {
  if (!summaryEn) return [];

  const lines = summaryEn
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    return lines;
  }

  const normalized = summaryEn.replace(/\s+/g, " ").trim();
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function extractTopicEnglish(outputText: string): string | null {
  const labeledMatch = outputText.match(
    /2\.\s*주제문\s*\(Topic Sentence\)[\s\S]*?English:\s*(.+?)\nKorean:/
  );
  if (labeledMatch) {
    return labeledMatch[1].trim();
  }

  const topicSectionMatch = outputText.match(
    /2\.\s*주제문\s*\(Topic Sentence\)[\s\S]*?(?=3\.\s*본문 요약|$)/
  );
  if (!topicSectionMatch) {
    return null;
  }

  const topicLines = topicSectionMatch[0]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^2\.\s*주제문/.test(line))
    .filter((line) => !/^English:/i.test(line))
    .filter((line) => !/^Korean:/i.test(line));

  return topicLines.length > 0 ? topicLines[0] : null;
}

function extractSummaryEnglish(outputText: string): string | null {
  const labeledMatch = outputText.match(
    /3\.\s*본문 요약\s*\(Summary\)[\s\S]*?English:\s*([\s\S]*?)\nKorean:/
  );
  if (labeledMatch) {
    return labeledMatch[1].trim();
  }

  const lines = extractSummaryContentLines(outputText);
  return lines.length > 0 ? lines[0] : null;
}

function extractSummaryKorean(outputText: string): string | null {
  const labeledMatch = outputText.match(
    /3\.\s*본문 요약\s*\(Summary\)[\s\S]*?Korean:\s*([\s\S]*?)(?=4\.\s*글의 흐름|$)/
  );
  if (labeledMatch) {
    return labeledMatch[1].trim();
  }

  const lines = extractSummaryContentLines(outputText);
  return lines.length > 1 ? lines[1] : null;
}

function extractSummaryContentLines(outputText: string): string[] {
  const sectionMatch = outputText.match(
    /3\.\s*본문 요약\s*\(Summary\)[\s\S]*?(?=4\.\s*글의 흐름|$)/
  );

  if (!sectionMatch) {
    return [];
  }

  return sectionMatch[0]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^3\.\s*본문 요약/.test(line))
    .map((line) => line.replace(/^\s*(English|Korean):\s*/i, ""))
    .filter((line) => line.length > 0);
}

function extractFlowLines(outputText: string): { raw: string; text: string }[] {
  const sectionMatch = outputText.match(
    /4\.\s*글의 흐름 4단 정리\s*\(Logical Flow\)[\s\S]*?(?=5\.\s*핵심 어휘|$)/
  );

  if (!sectionMatch) {
    return [];
  }

  return sectionMatch[0]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/^4\.\s*글의 흐름/.test(line))
    .map((line) => ({
      raw: line,
      text: line.replace(/^\d+\.\s*/, "").trim(),
    }));
}

const THRESHOLDS = {
  advanced: {
    topicMin: 16,
    topicMax: 18,
    summarySentencesMin: 2,
    summarySentencesMax: 2,
    sentenceWordsMin: 12,
    sentenceWordsMax: 15,
    summaryTotalMax: 28,
  },
  basic: {
    topicMin: 10,
    topicMax: 14,
    summarySentencesMin: 2,
    summarySentencesMax: 2,
    sentenceWordsMin: 8,
    sentenceWordsMax: 12,
    summaryTotalMax: 22,
  },
} as const;

type ContentLevel = keyof typeof THRESHOLDS;

export interface ValidationResult {
  name: string;
  passed: boolean;
  errors: string[];
  info: string[];
}

function getThreshold(level: string) {
  return level in THRESHOLDS
    ? THRESHOLDS[level as ContentLevel]
    : THRESHOLDS.advanced;
}

export function validateOutputText(
  name: string,
  outputText: string,
  level = "advanced"
): ValidationResult {
  const errors: string[] = [];
  const info: string[] = [];
  const threshold = getThreshold(level);

  const topicEn = extractTopicEnglish(outputText);
  if (!topicEn) {
    errors.push("Topic English 라인을 찾지 못했습니다.");
  } else {
    const topicWords = countWords(topicEn);
    info.push(`Topic 단어수: ${topicWords}`);
    if (topicWords < threshold.topicMin || topicWords > threshold.topicMax) {
      errors.push(
        `Topic 단어 수 위반: ${topicWords}단어 (허용 ${threshold.topicMin}~${threshold.topicMax})`
      );
    }
  }

  const summaryEn = extractSummaryEnglish(outputText);
  const summaryKo = extractSummaryKorean(outputText);
  if (!summaryEn) {
    errors.push("Summary English 라인을 찾지 못했습니다.");
  } else {
    if (/\n/.test(summaryEn)) {
      errors.push("Summary English 줄바꿈 위반: 한 줄로 작성해야 합니다.");
    }

    const summarySentences = splitSentences(summaryEn);
    info.push(`Summary 문장수: ${summarySentences.length}`);

    if (
      summarySentences.length < threshold.summarySentencesMin ||
      summarySentences.length > threshold.summarySentencesMax
    ) {
      errors.push(
        `Summary 문장 수 위반: ${summarySentences.length}문장 (허용 ${threshold.summarySentencesMin}~${threshold.summarySentencesMax})`
      );
    }

    summarySentences.forEach((sentence, index) => {
      const words = countWords(sentence);
      info.push(`  - [문장 ${index + 1}] 단어수: ${words}`);
      if (words < threshold.sentenceWordsMin || words > threshold.sentenceWordsMax) {
        errors.push(
          `Summary ${index + 1}번째 문장 단어 수 위반: ${words}단어 (허용 ${threshold.sentenceWordsMin}~${threshold.sentenceWordsMax})`
        );
      }
    });

    const totalWords = countWords(summaryEn);
    info.push(`Summary 총 단어수: ${totalWords}`);
    if (totalWords > threshold.summaryTotalMax) {
      errors.push(
        `Summary 총 단어 수 위반: ${totalWords}단어 (허용 <= ${threshold.summaryTotalMax})`
      );
    }
  }

  if (summaryKo && /\n/.test(summaryKo)) {
    errors.push("Summary Korean 줄바꿈 위반: 한 줄로 작성해야 합니다.");
  }

  const flowLines = extractFlowLines(outputText);
  info.push(`Flow 항목수: ${flowLines.length}`);

  if (flowLines.length !== 4) {
    errors.push(`Flow 항목 수 위반: ${flowLines.length}개 (허용 4)`);
  }

  flowLines.forEach((line, index) => {
    if (/^\d+\./.test(line.raw)) {
      errors.push(
        `Flow ${index + 1}번째 줄 형식 위반: 번호 인덱스 제거 필요 ("${line.raw}")`
      );
    }

    if (!line.text) {
      errors.push(`Flow ${index + 1}번째 줄 내용이 비어 있습니다.`);
    }
  });

  return {
    name,
    passed: errors.length === 0,
    errors,
    info,
  };
}
