interface ParsedEntry {
  word: string;
  meaning: string;
  raw: string;
  usedParenFormat?: boolean;
  invalid?: boolean;
}

interface ParsedItem {
  head: ParsedEntry;
  synonyms: ParsedEntry[];
  antonyms: ParsedEntry[];
  metaLabelUsed: boolean;
}

function extractCoreVocabularySection(outputText: string): string | null {
  const match = outputText.match(/5\.\s*핵심 어휘 및 확장[\s\S]*$/);
  return match ? match[0] : null;
}

function stripLabelPrefix(line: string, label: string): string {
  return line
    .replace(new RegExp(`^${label}(?:\\(\\d+\\))?\\s*:?\\s*`), "")
    .trim();
}

function parseHeadEntry(line: string): ParsedEntry | null {
  if (!/^\d+\./.test(line)) return null;

  const withoutNumber = line.replace(/^\d+\.\s*/, "").trim();
  if (!withoutNumber) return null;
  if (/^핵심 어휘 및 확장/.test(withoutNumber)) return null;
  if (/^(유의어|반의어)/.test(withoutNumber)) return null;

  const pairMatch = withoutNumber.match(/^([^\s()]+)\s+(.+)$/);
  if (!pairMatch) return null;

  return {
    word: pairMatch[1].trim(),
    meaning: pairMatch[2].trim(),
    raw: line.trim(),
  };
}

function parseRelatedEntries(body: string): ParsedEntry[] {
  if (!body) return [];

  return body
    .split(/,\s*/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const plainMatch = entry.match(/^([^\s()]+)\s+(.+)$/);
      if (plainMatch) {
        return {
          word: plainMatch[1].trim(),
          meaning: plainMatch[2].trim(),
          raw: entry,
        };
      }

      const parenMatch = entry.match(/^(.+?)\s*\(([^()]+)\)$/);
      if (parenMatch) {
        return {
          word: parenMatch[1].trim(),
          meaning: parenMatch[2].trim(),
          raw: entry,
          usedParenFormat: true,
        };
      }

      return {
        word: entry,
        meaning: "",
        raw: entry,
        invalid: true,
      };
    });
}

function splitItems(sectionText: string): ParsedItem[] {
  const lines = sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items: ParsedItem[] = [];
  let current: ParsedItem | null = null;
  let currentMode: "syn" | "ant" | null = null;

  const commitCurrent = () => {
    if (current) {
      items.push(current);
      current = null;
      currentMode = null;
    }
  };

  for (const line of lines) {
    if (/^5\.\s*핵심 어휘 및 확장/.test(line)) {
      continue;
    }

    const headEntry = parseHeadEntry(line);
    if (headEntry) {
      commitCurrent();
      current = {
        head: headEntry,
        synonyms: [],
        antonyms: [],
        metaLabelUsed: false,
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const synonymMatch = line.match(/^유의어(?:\((\d+)\))?\s*:?(.*)$/);
    if (synonymMatch) {
      currentMode = "syn";
      if (synonymMatch[1]) {
        current.metaLabelUsed = true;
      }

      const body = stripLabelPrefix(line, "유의어");
      const entries = parseRelatedEntries(body);
      if (entries.length > 0) {
        current.synonyms.push(...entries);
      }
      continue;
    }

    const antonymMatch = line.match(/^반의어(?:\((\d+)\))?\s*:?(.*)$/);
    if (antonymMatch) {
      currentMode = "ant";
      if (antonymMatch[1]) {
        current.metaLabelUsed = true;
      }

      const body = stripLabelPrefix(line, "반의어");
      const entries = parseRelatedEntries(body);
      if (entries.length > 0) {
        current.antonyms.push(...entries);
      }
      continue;
    }

    const entries = parseRelatedEntries(line);
    if (currentMode === "syn") {
      current.synonyms.push(...entries);
    } else if (currentMode === "ant") {
      current.antonyms.push(...entries);
    }
  }

  commitCurrent();
  return items;
}

function validateEntryMeaning(args: {
  itemNumber: number;
  label: string;
  index: number;
  entry: ParsedEntry;
  errors: string[];
}) {
  const { itemNumber, label, index, entry, errors } = args;

  if (entry.invalid || !entry.word || !entry.meaning) {
    errors.push(
      `${itemNumber}번 항목 ${label} ${index + 1} 형식 오류: "${entry.raw}" (필수: 단어 한글뜻1개)`
    );
    return;
  }

  if (entry.usedParenFormat || /[()]/.test(entry.raw)) {
    errors.push(
      `${itemNumber}번 항목 ${label} ${index + 1} 형식 위반: 괄호 표기 금지 ("${entry.raw}")`
    );
  }

  if (/[,/]/.test(entry.meaning)) {
    errors.push(
      `${itemNumber}번 항목 ${label} ${index + 1} 뜻 오류: "${entry.meaning}" (복수 뜻 금지)`
    );
  }
}

const VOCAB_THRESHOLDS = {
  advanced: {
    vocabCountMin: 4,
    vocabCountMax: 10,
    synonymsMin: 3,
    synonymsMax: 3,
    antonymsMin: 2,
    antonymsMax: 2,
  },
  basic: {
    vocabCountMin: 4,
    vocabCountMax: 10,
    synonymsMin: 3,
    synonymsMax: 3,
    antonymsMin: 2,
    antonymsMax: 2,
  },
} as const;

type ContentLevel = keyof typeof VOCAB_THRESHOLDS;

interface ValidationResult {
  name: string;
  passed: boolean;
  errors: string[];
  info: string[];
}

function getThreshold(level: string) {
  return level in VOCAB_THRESHOLDS
    ? VOCAB_THRESHOLDS[level as ContentLevel]
    : VOCAB_THRESHOLDS.advanced;
}

export function validateVocabText(
  name: string,
  outputText: string,
  level = "advanced"
): ValidationResult {
  const errors: string[] = [];
  const info: string[] = [];
  const threshold = getThreshold(level);

  const section = extractCoreVocabularySection(outputText);
  if (!section) {
    errors.push("'5. 핵심 어휘 및 확장' 섹션을 찾지 못했습니다.");
    return {
      name,
      passed: false,
      errors,
      info,
    };
  }

  const items = splitItems(section);
  info.push(`핵심 어휘 항목 수: ${items.length}`);

  if (items.length < threshold.vocabCountMin || items.length > threshold.vocabCountMax) {
    errors.push(
      `Core Vocabulary 항목 수 위반: ${items.length}개 (허용 ${threshold.vocabCountMin}~${threshold.vocabCountMax}개)`
    );
  }

  items.forEach((item, index) => {
    const itemNumber = index + 1;

    if (item.metaLabelUsed) {
      errors.push(
        `${itemNumber}번 항목 라벨 형식 위반: 유의어(3)/반의어(2) 같은 개수 표기 금지`
      );
    }

    if (/[()]/.test(item.head.raw)) {
      errors.push(
        `${itemNumber}번 항목 형식 위반: 괄호 표기 금지 ("${item.head.raw}")`
      );
    }

    if (/[,/]/.test(item.head.meaning)) {
      errors.push(
        `${itemNumber}번 항목 뜻 오류: "${item.head.meaning}" (복수 뜻 금지)`
      );
    }

    if (
      item.synonyms.length < threshold.synonymsMin ||
      item.synonyms.length > threshold.synonymsMax
    ) {
      errors.push(
        `${itemNumber}번 항목 유의어 개수 위반: ${item.synonyms.length}개 (허용 ${threshold.synonymsMin}~${threshold.synonymsMax})`
      );
    }

    if (
      item.antonyms.length < threshold.antonymsMin ||
      item.antonyms.length > threshold.antonymsMax
    ) {
      errors.push(
        `${itemNumber}번 항목 반의어 개수 위반: ${item.antonyms.length}개 (허용 ${threshold.antonymsMin}~${threshold.antonymsMax})`
      );
    }

    item.synonyms.forEach((entry, relatedIndex) => {
      validateEntryMeaning({
        itemNumber,
        label: "유의어",
        index: relatedIndex,
        entry,
        errors,
      });
    });

    item.antonyms.forEach((entry, relatedIndex) => {
      validateEntryMeaning({
        itemNumber,
        label: "반의어",
        index: relatedIndex,
        entry,
        errors,
      });
    });
  });

  return {
    name,
    passed: errors.length === 0,
    errors,
    info,
  };
}
