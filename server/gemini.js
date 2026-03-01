/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleGenAI } = require("@google/genai");

const MODEL_NAME = "gemini-2.5-pro";

/**
 * Gemini 클라이언트를 생성한다.
 *
 * - 기본(Cloud Run): Vertex AI 모드 (vertexai: true, ADC 인증)
 *   → GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION 필요
 *
 * - 로컬 테스트 전용: GOOGLE_API_KEY 가 설정되어 있으면 API key 모드로 폴백
 *   (운영 환경에서는 사용 금지)
 */
function createGeminiClient() {
  // 우선순위: GOOGLE_CLOUD_API_KEY > GOOGLE_API_KEY (하위호환)
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY;

  if (apiKey) {
    // 로컬 테스트 전용 — API key 모드
    return new GoogleGenAI({ apiKey });
  }

  // 운영(Cloud Run) — Vertex AI + ADC 모드
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION;

  if (!project || !location) {
    throw new Error(
      "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set for Vertex AI mode."
    );
  }

  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
  });
}

function extractText(response) {
  if (typeof response?.text === "string") {
    return response.text;
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

async function generateOnePassage(ai, systemPrompt, passage) {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemPrompt,
    },
    contents: passage,
  });

  return extractText(response).trim();
}

module.exports = {
  MODEL_NAME,
  createGeminiClient,
  generateOnePassage,
};
