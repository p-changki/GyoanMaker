#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const {
  validateVocabText: validateOutputText,
} = require("../validators/validateVocab");

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
