import { parseHandoutSection } from "@/lib/parseHandout";

export function normalizeHandoutRawText(rawText: string): string {
  if (!rawText || rawText.trim().length === 0) {
    return rawText;
  }

  const parsed = parseHandoutSection("P00", rawText);
  if (!parsed.isParsed) {
    return rawText;
  }

  const lines: string[] = [];
  const titleLine = rawText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => /^\[.+\]$/.test(line));

  if (titleLine) {
    lines.push(titleLine, "");
  }

  lines.push("1. 문장별 구문 분석 및 해석 (Sentence by Sentence)");
  lines.push("영어 섹션");
  parsed.sentences.forEach((pair) => {
    lines.push(pair.en);
  });
  lines.push("한글 섹션");
  parsed.sentences.forEach((pair) => {
    lines.push(pair.ko);
  });

  lines.push(
    "",
    "2. 주제문 (Topic Sentence)",
    parsed.topic.en,
    parsed.topic.ko,
    "",
    "3. 본문 요약 (Summary)",
    normalizeInline(parsed.summary.en),
    normalizeInline(parsed.summary.ko),
    "",
    "4. 글의 흐름 4단 정리 (Logical Flow)"
  );

  parsed.flow.forEach((flowItem) => {
    lines.push(flowItem.text);
  });

  lines.push("", "5. 핵심 어휘 및 확장 (Core Vocabulary)");

  parsed.vocabulary.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.word} ${item.meaning}`);
    lines.push("유의어");
    item.synonyms.forEach((entry) => {
      lines.push(`${entry.word} ${entry.meaning}`.trim());
    });
    lines.push("반의어");
    item.antonyms.forEach((entry) => {
      lines.push(`${entry.word} ${entry.meaning}`.trim());
    });

    if (index < parsed.vocabulary.length - 1) {
      lines.push("");
    }
  });

  return lines
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();
}

function normalizeInline(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
