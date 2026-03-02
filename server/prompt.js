const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getAuthMode } = require("./gemini");

const PROMPT_FILE = path.join(__dirname, "system-prompt.txt");

/**
 * 시스템 프롬프트 및 메타데이터를 가져온다.
 *
 * 우선순위:
 *   1. SYSTEM_PROMPT_B64 환경변수
 *   2. SYSTEM_PROMPT 환경변수
 *   3. server/system-prompt.txt 파일 (기본값)
 */
function getPromptInfo() {
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

  // 3) 파일 기반 (기본값)
  try {
    if (fs.existsSync(PROMPT_FILE)) {
      const filePrompt = fs.readFileSync(PROMPT_FILE, "utf-8").trim();
      if (filePrompt.length > 0) {
        return { text: filePrompt, source: "file" };
      }
    }
  } catch {
    // 파일 읽기 실패 시 null 반환
  }

  return null;
}

/**
 * /generate 등에서 사용할 프롬프트 텍스트만 반환한다.
 */
function getSystemPrompt() {
  const info = getPromptInfo();
  return info ? info.text : null;
}

/**
 * /meta 엔드포인트에서 사용할 메타데이터를 반환한다.
 */
function getPromptMetadata() {
  const info = getPromptInfo();
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
