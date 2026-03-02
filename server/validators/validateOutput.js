function countWords(text) {
  if (!text) return 0;
  // 1. 대시(엔대시, 엠대시) 및 스마트따옴표 정규화
  let normalized = text.replace(/[–—]/g, "-").replace(/[‘’]/g, "'");

  // 2. 허용할 문자: 알파벳, 숫자, 공백, 하이픈(-), 아포스트로피(')
  // 나머지는 공백으로 치환
  normalized = normalized.replace(/[^A-Za-z0-9\s-']/g, " ");

  // 3. 공백 기준으로 토큰화 및 빈 토큰 제거
  const tokens = normalized.trim().split(/\s+/).filter(Boolean);

  // 4. (분리된 의미 없는 단일 하이픈 등 제외용) 알파벳/숫자가 포함된 토큰만 카운트
  const validWords = tokens.filter((t) => /[A-Za-z0-9]/.test(t));
  return validWords.length;
}

function splitSentences(summaryEn) {
  if (!summaryEn) return [];

  // 1. 우선 줄바꿈 단위로 문장 분리 (우리의 줄바꿈 의도를 최우선 존중)
  const lines = summaryEn
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 2줄 이상이면 그대로 문장으로 간주
  if (lines.length >= 2) {
    return lines;
  }

  // 2. 줄바꿈이 없거나 1줄이면 기존 로직(마침표, 느낌표, 물음표 뒤 공백)으로 분리
  const normalized = summaryEn.replace(/\s+/g, " ").trim();
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extractTopicEnglish(outputText) {
  const topicMatch = outputText.match(
    /2\.\s*주제문\s*\(Topic Sentence\)[\s\S]*?English:\s*(.+?)\nKorean:/
  );
  return topicMatch ? topicMatch[1].trim() : null;
}

function extractSummaryEnglish(outputText) {
  const summaryMatch = outputText.match(
    /3\.\s*본문 요약\s*\(Summary\)[\s\S]*?English:\s*([\s\S]*?)\nKorean:/
  );
  // 줄바꿈(\n)을 살려두어야 splitSentences 에서 우선 분리 가능 (기존 replace(/\s+/g, ' ') 삭제)
  return summaryMatch ? summaryMatch[1].trim() : null;
}

function validateOutputText(name, outputText) {
  const errors = [];
  const info = [];

  const topicEn = extractTopicEnglish(outputText);
  if (!topicEn) {
    errors.push("Topic English 라인을 찾지 못했습니다.");
  } else {
    const topicWords = countWords(topicEn);
    info.push(`Topic 단어수: ${topicWords}`);
    if (topicWords < 16 || topicWords > 18) {
      errors.push(`Topic 단어 수 위반: ${topicWords}단어 (허용 16~18)`);
    }
  }

  const summaryEn = extractSummaryEnglish(outputText);
  if (!summaryEn) {
    errors.push("Summary English 라인을 찾지 못했습니다.");
  } else {
    const summarySentences = splitSentences(summaryEn);
    info.push(`Summary 문장수: ${summarySentences.length}`);

    if (summarySentences.length !== 2) {
      errors.push(
        `Summary 문장 수 위반: ${summarySentences.length}문장 (허용 2)`
      );
    }

    summarySentences.forEach((sentence, index) => {
      const words = countWords(sentence);
      info.push(`  - [문장 ${index + 1}] 단어수: ${words}`);
      if (words < 12 || words > 15) {
        errors.push(
          `Summary ${index + 1}번째 문장 단어 수 위반: ${words}단어 (허용 12~15)`
        );
      }
    });

    const totalWords = countWords(summaryEn);
    info.push(`Summary 총 단어수: ${totalWords}`);
    if (totalWords > 28) {
      errors.push(`Summary 총 단어 수 위반: ${totalWords}단어 (허용 <= 28)`);
    }
  }

  return {
    name,
    passed: errors.length === 0,
    errors,
    info,
  };
}

module.exports = {
  validateOutputText,
  countWords,
  splitSentences,
  extractTopicEnglish,
  extractSummaryEnglish,
};
