/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const PROMPT_FILE = path.join(__dirname, "system-prompt.txt");

/**
 * 시스템 프롬프트를 가져온다.
 *
 * 우선순위:
 *   1. SYSTEM_PROMPT_B64 환경변수 (Base64 → UTF-8 디코딩)
 *   2. SYSTEM_PROMPT 환경변수 (raw text)
 *   3. server/system-prompt.txt 파일 (로컬 개발)
 *
 * 모두 없으면 null 반환 → server.js에서 에러 처리.
 */
function getSystemPrompt() {
  // 1) Base64 인코딩된 프롬프트 (Cloud Run 권장)
  const b64 = process.env.SYSTEM_PROMPT_B64;
  if (b64 && b64.trim().length > 0) {
    try {
      const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
      if (decoded.length > 0) {
        return decoded;
      }
    } catch {
      // Base64 디코딩 실패 시 다음 단계로
    }
  }

  // 2) Raw text 프롬프트
  const rawPrompt = process.env.SYSTEM_PROMPT;
  if (rawPrompt && rawPrompt.trim().length > 0) {
    return rawPrompt;
  }

  // 3) 파일 폴백 (로컬 개발)
  try {
    if (fs.existsSync(PROMPT_FILE)) {
      const filePrompt = fs.readFileSync(PROMPT_FILE, "utf-8").trim();
      if (filePrompt.length > 0) {
        return filePrompt;
      }
    }
  } catch {
    // 파일 읽기 실패 시 무시
  }

  return null;
}

module.exports = {
  getSystemPrompt,
};
