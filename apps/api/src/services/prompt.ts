import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAuthMode } from "./gemini";

const SECRET_PATHS = {
  advanced: "/workspace/apps/api/secrets/system-prompt/system-prompt",
  basic: "/workspace/apps/api/secrets/system-prompt-basic/system-prompt-basic",
} as const;

const LOCAL_PATHS = {
  advanced: path.join(__dirname, "../../system-prompt.txt"),
  basic: path.join(__dirname, "../../system-prompt-basic.txt"),
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

export function getSystemPrompt(level: PromptLevel = "advanced"): string | null {
  const info = getPromptInfo(level);
  return info ? info.text : null;
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
