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

function extractSummaryEnglish(outputText) {
  const labeledMatch = outputText.match(
    /3\.\s*본문 요약\s*\(Summary\)[\s\S]*?English:\s*([\s\S]*?)\nKorean:/
  );
  if (labeledMatch) {
    return labeledMatch[1].trim();
  }

  const lines = extractSummaryContentLines(outputText);
  return lines.length > 0 ? lines[0] : null;
}

function extractSummaryKorean(outputText) {
  const labeledMatch = outputText.match(
    /3\.\s*본문 요약\s*\(Summary\)[\s\S]*?Korean:\s*([\s\S]*?)(?=4\.\s*글의 흐름|$)/
  );
  if (labeledMatch) {
    return labeledMatch[1].trim();
  }

  const lines = extractSummaryContentLines(outputText);
  return lines.length > 1 ? lines[1] : null;
}

function extractSummaryContentLines(outputText) {
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

function extractFlowLines(outputText) {
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
  const summaryKo = extractSummaryKorean(outputText);
  if (!summaryEn) {
    errors.push("Summary English 라인을 찾지 못했습니다.");
  } else {
    if (/\n/.test(summaryEn)) {
      errors.push("Summary English 줄바꿈 위반: 한 줄로 작성해야 합니다.");
    }

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

module.exports = {
  validateOutputText,
  countWords,
  splitSentences,
  extractTopicEnglish,
  extractSummaryEnglish,
  extractFlowLines,
};
