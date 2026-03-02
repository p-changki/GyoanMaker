const { GoogleGenAI } = require("@google/genai");

// 환경변수에서 모델명을 가져오거나 기본값으로 gemini-2.5-pro 사용
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-pro";

/**
 * Gemini 클라이언트를 생성한다. (통합 SDK @google/genai 용)
 */
function createGeminiClient() {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing in .env.local");
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * 응답 객체에서 텍스트를 안전하게 추출한다.
 */
function extractText(response) {
  try {
    if (typeof response?.text === "string") {
      return response.text;
    }
    if (typeof response?.text === "function") {
      return response.text();
    }
    const candidate = response?.candidates?.[0];
    return candidate?.content?.parts?.[0]?.text || "";
  } catch (e) {
    console.error("[gemini] Error extracting text:", e.message);
    return "";
  }
}

/**
 * 단일 지문에 대한 교안을 생성한다.
 */
async function generateOnePassage(ai, systemPrompt, passage) {
  const startTime = Date.now();
  console.log(`[gemini] >>> Start generating with ${MODEL_NAME}`);
  console.log(
    `[gemini] systemPrompt length: ${systemPrompt?.length || 0} chars`
  );

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemPrompt,
      },
      contents: passage,
    });

    const text = extractText(response);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[gemini] <<< Success! Took ${duration}s, output: ${text.length} chars`
    );

    return text.trim();
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[gemini] !!! Failed after ${duration}s:`, error.message);
    throw error;
  }
}

module.exports = {
  MODEL_NAME,
  createGeminiClient,
  generateOnePassage,
};
