const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getAuthMode } = require("./gemini");

const PROMPT_FILES = {
  advanced: path.join(__dirname, "system-prompt.txt"),
  basic: path.join(__dirname, "system-prompt-basic.txt"),
};

/**
 * Read a prompt file by level. Returns { text, source } or null.
 */
function loadPromptFile(level) {
  const filePath = PROMPT_FILES[level];
  if (!filePath) return null;

  try {
    if (fs.existsSync(filePath)) {
      const text = fs.readFileSync(filePath, "utf-8").trim();
      if (text.length > 0) {
        return { text, source: `file_${level}` };
      }
    }
  } catch {
    // file read failure
  }

  return null;
}

/**
 * 시스템 프롬프트 및 메타데이터를 가져온다.
 *
 * level = "advanced" (default) | "basic"
 *
 * 우선순위 (advanced only):
 *   1. SYSTEM_PROMPT_B64 환경변수
 *   2. SYSTEM_PROMPT 환경변수
 *   3. server/system-prompt.txt 파일
 *
 * basic level:
 *   1. server/system-prompt-basic.txt 파일
 *   2. fallback → advanced 프롬프트
 */
function getPromptInfo(level = "advanced") {
  // For basic level, try dedicated prompt file first
  if (level === "basic") {
    const basicPrompt = loadPromptFile("basic");
    if (basicPrompt) return basicPrompt;
    // fallback to advanced if basic file is missing
  }

  // Advanced level (or basic fallback): env overrides → file
  // 1) Base64 환경변수
  const b64 = process.env.SYSTEM_PROMPT_B64;
  if (b64 && b64.trim().length > 0) {
    try {
      const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
      if (decoded.length > 0) {
        return { text: decoded, source: "env_b64" };
      }
    } catch {
      // 디코딩 실패 시 다음 단계로
    }
  }

  // 2) Raw 환경변수
  const rawPrompt = process.env.SYSTEM_PROMPT;
  if (rawPrompt && rawPrompt.trim().length > 0) {
    return { text: rawPrompt, source: "env_raw" };
  }

  // 3) 파일 기반 (advanced)
  return loadPromptFile("advanced");
}

/**
 * /generate 등에서 사용할 프롬프트 텍스트만 반환한다.
 */
function getSystemPrompt(level = "advanced") {
  const info = getPromptInfo(level);
  return info ? info.text : null;
}

/**
 * /meta 엔드포인트에서 사용할 메타데이터를 반환한다.
 * Always returns advanced prompt metadata for consistency.
 */
function getPromptMetadata() {
  const info = getPromptInfo("advanced");
  if (!info) return null;

  const sha256 = crypto.createHash("sha256").update(info.text).digest("hex");
  // 첫 줄의 일부만 보안상 노출
  const head = info.text.split("\n")[0].substring(0, 50).trim();

  return {
    source: info.source,
    sha256,
    head,
    authMode: getAuthMode() || "unknown",
  };
}

module.exports = {
  getSystemPrompt,
  getPromptMetadata,
};
