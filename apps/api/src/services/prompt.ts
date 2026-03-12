import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAuthMode } from "./gemini";

const SECRET_PATHS = {
  advanced: "/workspace/apps/api/secrets/system-prompt/system-prompt",
  basic: "/workspace/apps/api/secrets/system-prompt-basic/system-prompt-basic",
  workbook:
    "/workspace/apps/api/secrets/system-prompt-workbook/system-prompt-workbook",
  vocabBank:
    "/workspace/apps/api/secrets/system-prompt-vocab-bank/system-prompt-vocab-bank",
  pocketVoca:
    "/workspace/apps/api/secrets/system-prompt-pocket-voca/system-prompt-pocket-voca",
} as const;

const LOCAL_PATHS = {
  advanced: path.join(__dirname, "../../system-prompt.txt"),
  basic: path.join(__dirname, "../../system-prompt-basic.txt"),
  workbook: path.join(__dirname, "../../system-prompt-workbook.txt"),
  vocabBank: path.join(__dirname, "../../system-prompt-vocab-bank.txt"),
  pocketVoca: path.join(__dirname, "../../system-prompt-pocket-voca.txt"),
} as const;

const PROMPT_FILES = process.env.NODE_ENV === "production" ? SECRET_PATHS : LOCAL_PATHS;

type PromptLevel = keyof typeof PROMPT_FILES;

interface PromptInfo {
  text: string;
  source: string;
}

function loadPromptFile(level: PromptLevel): PromptInfo | null {
  const filePath = PROMPT_FILES[level];

  try {
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, "utf-8").trim();
      if (text.length > 0) {
        return { text, source: `file_${level}` };
      }
    }
  } catch {
    // prompt file read failure
  }

  return null;
}

function getPromptInfo(level: PromptLevel = "advanced"): PromptInfo | null {
  if (level === "workbook") {
    return loadPromptFile("workbook");
  }

  if (level === "vocabBank") {
    return loadPromptFile("vocabBank");
  }

  if (level === "pocketVoca") {
    return loadPromptFile("pocketVoca");
  }

  if (level === "basic") {
    const basicPrompt = loadPromptFile("basic");
    if (basicPrompt) return basicPrompt;
  }

  const b64 = process.env.SYSTEM_PROMPT_B64;
  if (b64 && b64.trim().length > 0) {
    try {
      const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
      if (decoded.length > 0) {
        return { text: decoded, source: "env_b64" };
      }
    } catch {
      // ignore invalid base64 and continue
    }
  }

  const rawPrompt = process.env.SYSTEM_PROMPT;
  if (rawPrompt && rawPrompt.trim().length > 0) {
    return { text: rawPrompt, source: "env_raw" };
  }

  return loadPromptFile("advanced");
}

export function getSystemPrompt(
  level: PromptLevel = "advanced",
  vocabCount: "standard" | "extended" = "standard"
): string | null {
  const info = getPromptInfo(level);
  if (!info) return null;

  if (vocabCount === "extended") {
    return info.text
      .replace(/반드시 4개 선정할 것/g, "반드시 7~10개 선정할 것")
      .replace(/핵심 어휘는 반드시 4개\./g, "핵심 어휘는 반드시 7~10개.")
      .replace(/4개 미만 출력 금지\. 후보가 부족하면 지문에서 추가 후보를 찾아 정확히 4개를 채울 것/g, "7~10개 미만 출력 금지. 후보가 부족하면 지문에서 추가 후보를 찾아 최소 7개를 채울 것")
      .replace(/총 4개는 반드시 유지/g, "총 7~10개는 반드시 유지")
      .replace(/4개 미만 출력 금지\. 부족하면 지문에서 후보를 추가로 찾아 4개를 채운 뒤 출력/g, "7개 미만 출력 금지. 부족하면 지문에서 후보를 추가로 찾아 최소 7개를 채운 뒤 출력");
  }

  return info.text;
}

export function getPromptMetadata() {
  const info = getPromptInfo("advanced");
  if (!info) return null;

  const sha256 = crypto.createHash("sha256").update(info.text).digest("hex");
  const head = info.text.split("\n")[0].substring(0, 50).trim();

  return {
    source: info.source,
    sha256,
    head,
    authMode: getAuthMode() ?? "unknown",
  };
}
