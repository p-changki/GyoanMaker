#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SAMPLE_FIXTURES = [
  {
    name: "fixture-1",
    outputText: `[강의용 교안: 실전 구문 & 논리 분석]

2. 주제문 (Topic Sentence)
English: A productive framing of reading as related practices linked by resemblance rather than a single fixed essence
Korean: 단일 본질보다 가족 유사성으로 연결된 독서 실천의 생산적 개념화

3. 본문 요약 (Summary)
English: Readers often treat reading as one stable activity with clear, consistent boundaries. Yet the passage defines it as varied behaviors connected by family resemblance, not essence.
Korean: 독서는 하나의 안정된 활동으로 오해되지만, 지문은 이를 본질보다 유사성으로 연결된 행동들로 본다.
`,
  },
  {
    name: "fixture-2",
    outputText: `[강의용 교안: 실전 구문 & 논리 분석]

2. 주제문 (Topic Sentence)
English: A policy critique showing that punitive framing obscures structural causes behind persistent educational inequality patterns today
Korean: 처벌 중심 프레이밍이 교육 불평등의 구조적 원인을 가린다는 정책 비판

3. 본문 요약 (Summary)
English: The text argues blame-centered explanations ignore systemic constraints shaping unequal educational outcomes. It recommends structural reforms that align incentives, access, and institutional accountability mechanisms.
Korean: 본문은 비난 중심 설명이 구조적 제약을 놓친다고 보고, 접근성과 책임성을 묶는 개혁을 제안한다.
`,
  },
  {
    name: "fixture-3",
    outputText: `[강의용 교안: 실전 구문 & 논리 분석]

2. 주제문 (Topic Sentence)
English: A nuanced argument that technological convenience can erode reflective attention without deliberate metacognitive safeguards in classrooms
Korean: 의도적 메타인지 장치 없이는 기술 편의가 성찰적 주의를 약화시킨다는 정교한 논지

3. 본문 요약 (Summary)
English: Convenience tools accelerate tasks but can weaken deep processing and reflective judgment habits. The passage urges intentional routines that preserve attention, evaluation, and long-term comprehension quality.
Korean: 편의 도구는 속도를 높이지만 심층 처리와 성찰 판단을 약화할 수 있어 의도적 루틴이 필요하다고 본다.
`,
  },
];

function countWords(text) {
  const matches = text.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g);
  return matches ? matches.length : 0;
}

function splitSentences(summaryEn) {
  const normalized = summaryEn.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

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
  return summaryMatch ? summaryMatch[1].replace(/\s+/g, " ").trim() : null;
}

function validateOutputText(name, outputText) {
  const errors = [];

  const topicEn = extractTopicEnglish(outputText);
  if (!topicEn) {
    errors.push("Topic English 라인을 찾지 못했습니다.");
  }

  if (topicEn) {
    const topicWords = countWords(topicEn);
    if (topicWords < 16 || topicWords > 18) {
      errors.push(`Topic English 단어 수 위반: ${topicWords} (허용 16~18)`);
    }
  }

  const summaryEn = extractSummaryEnglish(outputText);
  if (!summaryEn) {
    errors.push("Summary English 라인을 찾지 못했습니다.");
  }

  if (summaryEn) {
    const summarySentences = splitSentences(summaryEn);
    if (summarySentences.length !== 2) {
      errors.push(
        `Summary English 문장 수 위반: ${summarySentences.length} (허용 2)`
      );
    }

    summarySentences.forEach((sentence, index) => {
      const words = countWords(sentence);
      if (words < 12 || words > 15) {
        errors.push(
          `Summary English ${index + 1}문장 단어 수 위반: ${words} (허용 12~15)`
        );
      }
    });

    const totalWords = countWords(summaryEn);
    if (totalWords > 28) {
      errors.push(
        `Summary English 총 단어 수 위반: ${totalWords} (허용 <= 28)`
      );
    }
  }

  return {
    name,
    passed: errors.length === 0,
    errors,
  };
}

function loadFromPath(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");

  if (filePath.endsWith(".txt")) {
    return [{ name: path.basename(filePath), outputText: raw }];
  }

  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => {
      if (typeof item === "string") {
        return { name: `array-${index + 1}`, outputText: item };
      }

      return {
        name: item.name || `array-${index + 1}`,
        outputText: item.outputText || "",
      };
    });
  }

  if (parsed && Array.isArray(parsed.results)) {
    return parsed.results.map((item, index) => ({
      name: `result-${index + 1}`,
      outputText: item.outputText || "",
    }));
  }

  if (parsed && typeof parsed.outputText === "string") {
    return [
      { name: parsed.name || "single-output", outputText: parsed.outputText },
    ];
  }

  throw new Error(
    "지원하지 않는 입력 형식입니다. .txt 또는 outputText/results JSON을 사용하세요."
  );
}

function main() {
  const inputPath = process.argv[2];
  const targets = inputPath ? loadFromPath(inputPath) : SAMPLE_FIXTURES;

  const results = targets.map((t) => validateOutputText(t.name, t.outputText));
  const failed = results.filter((r) => !r.passed);

  results.forEach((r) => {
    if (r.passed) {
      console.log(`PASS - ${r.name}`);
    } else {
      console.log(`FAIL - ${r.name}`);
      r.errors.forEach((e) => {
        console.log(`  - ${e}`);
      });
    }
  });

  if (failed.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All checks passed (${results.length})`);
}

main();
