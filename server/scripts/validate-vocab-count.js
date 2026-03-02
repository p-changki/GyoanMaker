#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function extractCoreVocabularySection(outputText) {
  const match = outputText.match(/5\.\s*핵심 어휘 및 확장[\s\S]*$/);
  return match ? match[0] : null;
}

function splitItems(sectionText) {
  return sectionText
    .split(/\n(?=\d+\.)/)
    .map((block) => block.trim())
    .filter((block) => {
      const firstLine = block.split("\n")[0]?.trim() || "";
      if (!/^\d+\./.test(firstLine)) {
        return false;
      }
      if (/^5\.\s*핵심 어휘 및 확장/.test(firstLine)) {
        return false;
      }
      return true;
    });
}

function stripLabelPrefix(line, label) {
  return line
    .replace(new RegExp(`^${label}\\(\\d+\\):\\s*`), "")
    .replace(new RegExp(`^${label}:\\s*`), "")
    .trim();
}

function parseRelatedLine({ line, label, expectedCount, itemNumber, errors }) {
  if (!line) {
    errors.push(`${itemNumber}번 항목 ${label} 라인이 없습니다.`);
    return;
  }

  const body = stripLabelPrefix(line, label);
  const entries = body
    .split(/,\s*/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length !== expectedCount) {
    errors.push(
      `${itemNumber}번 항목 ${label} 개수 위반: ${entries.length}개 (필수 ${expectedCount}개)`
    );
  }

  entries.forEach((entry, index) => {
    const match = entry.match(/^(.+?)\s*\(([^()]+)\)$/);

    if (!match) {
      errors.push(
        `${itemNumber}번 항목 ${label} ${index + 1} 형식 오류: "${entry}" (필수: 단어 (뜻))`
      );
      return;
    }

    const meaning = match[2].trim();
    if (meaning.length === 0) {
      errors.push(
        `${itemNumber}번 항목 ${label} ${index + 1} 뜻 누락: "${entry}"`
      );
      return;
    }

    if (/[,/]/.test(meaning)) {
      errors.push(
        `${itemNumber}번 항목 ${label} ${index + 1} 뜻 오류: "${meaning}" (복수 뜻 금지)`
      );
    }
  });
}

function validateOutputText(name, outputText) {
  const errors = [];
  const info = [];

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

  if (items.length !== 4) {
    errors.push(`Core Vocabulary 항목 수 위반: ${items.length}개 (필수 4개)`);
  }

  items.forEach((block, index) => {
    const itemNumber = index + 1;
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const headLine = lines.find((line) => /^\d+\./.test(line));
    if (!headLine) {
      errors.push(`${itemNumber}번 항목 시작 라인을 찾지 못했습니다.`);
      return;
    }

    const headMatch = headLine.match(/^\d+\.\s*(.+?)\s*\(([^()]+)\)\s*$/);
    if (!headMatch) {
      errors.push(
        `${itemNumber}번 항목 형식 오류: "${headLine}" (필수: [숫자]. 단어 (뜻))`
      );
    } else {
      const meaning = headMatch[2].trim();
      if (/[,/]/.test(meaning)) {
        errors.push(
          `${itemNumber}번 항목 뜻 오류: "${meaning}" (복수 뜻 금지)`
        );
      }
    }

    const synonymLine = lines.find((line) => line.includes("유의어"));
    const antonymLine = lines.find((line) => line.includes("반의어"));

    parseRelatedLine({
      line: synonymLine,
      label: "유의어",
      expectedCount: 3,
      itemNumber,
      errors,
    });

    parseRelatedLine({
      line: antonymLine,
      label: "반의어",
      expectedCount: 2,
      itemNumber,
      errors,
    });
  });

  return {
    name,
    passed: errors.length === 0,
    errors,
    info,
  };
}

function normalizeResult(item, index) {
  if (typeof item === "string") {
    return {
      name: `result-${index + 1}`,
      outputText: item,
    };
  }

  if (item && typeof item.outputText === "string") {
    return {
      name: item.name || `result-${index + 1}`,
      outputText: item.outputText,
    };
  }

  return {
    name: `result-${index + 1}`,
    outputText: "",
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
    return parsed.map((item, index) => normalizeResult(item, index));
  }

  if (parsed && Array.isArray(parsed.results)) {
    return parsed.results.map((item, index) => normalizeResult(item, index));
  }

  if (parsed && typeof parsed.outputText === "string") {
    return [
      {
        name: parsed.name || "single-output",
        outputText: parsed.outputText,
      },
    ];
  }

  throw new Error(
    "지원하지 않는 입력 형식입니다. .txt 또는 outputText/results JSON을 사용하세요."
  );
}

function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.log(
      "Usage: node server/scripts/validate-vocab-count.js <handout.txt|generate-output.json>"
    );
    process.exitCode = 1;
    return;
  }

  let targets;
  try {
    targets = loadFromPath(inputPath);
  } catch (error) {
    console.log(`❌ FAIL - 입력 로드 실패`);
    console.log(`   [ERROR] ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const results = targets.map((target) =>
    validateOutputText(target.name, target.outputText)
  );
  const failed = results.filter((result) => !result.passed);

  results.forEach((result) => {
    if (result.passed) {
      console.log(`✅ PASS - ${result.name}`);
      result.info.forEach((line) => {
        console.log(`   ${line}`);
      });
    } else {
      console.log(`❌ FAIL - ${result.name}`);
      result.info.forEach((line) => {
        console.log(`   ${line}`);
      });
      result.errors.forEach((line) => {
        console.log(`   [ERROR] ${line}`);
      });
    }
    console.log("-".repeat(40));
  });

  if (failed.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`🎉 All checks passed (${results.length})`);
}

main();
