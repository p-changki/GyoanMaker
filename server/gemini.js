const { GoogleGenAI } = require("@google/genai");
const { validateOutputText } = require("./validators/validateOutput");
const { validateVocabText } = require("./validators/validateVocab");

const ENABLE_REPAIR = process.env.ENABLE_REPAIR !== "false";
const REPAIR_MAX_ATTEMPTS = 1;

// 환경변수에서 모델명을 가져오거나 기본값으로 gemini-2.5-pro 사용
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-pro";

/**
 * 현재 인증 모드를 반환한다.
 * - "vertex": GOOGLE_CLOUD_PROJECT가 있을 때 Vertex AI ADC 방식
 * - "apikey": GOOGLE_API_KEY 또는 GOOGLE_CLOUD_API_KEY 방식 (로컬 개발용)
 */
function getAuthMode() {
  if (process.env.GOOGLE_CLOUD_PROJECT) return "vertex";
  if (process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY)
    return "apikey";
  return null;
}

/**
 * Gemini 클라이언트를 생성한다.
 *
 * 우선순위:
 *   1. GOOGLE_CLOUD_PROJECT 있으면 Vertex AI ADC 모드 (Cloud Run 운영)
 *   2. GOOGLE_CLOUD_API_KEY 또는 GOOGLE_API_KEY 로 API Key 모드 (로컬 개발)
 */
function createGeminiClient() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY;

  if (project) {
    // ① Vertex AI ADC 모드: Cloud Run 서비스 계정 권한으로 자동 인증
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  if (apiKey) {
    // ② API Key 모드: 로컬 개발 전용
    return new GoogleGenAI({ apiKey });
  }

  throw new Error(
    "[gemini] 인증 정보가 없습니다. " +
      "Cloud Run 운영: GOOGLE_CLOUD_PROJECT 환경변수 필요. " +
      "로컬 개발: GOOGLE_API_KEY 또는 GOOGLE_CLOUD_API_KEY 환경변수 필요."
  );
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
  const authMode = getAuthMode();
  console.log(
    `[gemini] >>> Start generating with ${MODEL_NAME} (authMode: ${authMode})`
  );
  console.log(
    `[gemini] systemPrompt length: ${systemPrompt?.length || 0} chars`
  );

  try {
    let response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemPrompt,
      },
      contents: passage,
    });

    let text = extractText(response);
    let finalWarnings = [];

    if (ENABLE_REPAIR) {
      let attempt = 0;
      while (attempt <= REPAIR_MAX_ATTEMPTS) {
        const outRes = validateOutputText("check", text);
        const vocabRes = validateVocabText("check", text);

        const allErrors = [...outRes.errors, ...vocabRes.errors];
        if (allErrors.length === 0) {
          if (attempt > 0) {
            console.log(`[gemini] <<< Retry success!`);
          }
          break; // PASS
        }

        if (attempt >= REPAIR_MAX_ATTEMPTS) {
          console.warn(`[gemini] !!! Retry failed. Returns with warnings.`);
          console.warn(
            `[gemini] Errors: ${allErrors.slice(0, 2).join(", ")}${allErrors.length > 2 ? "..." : ""}`
          );
          finalWarnings = allErrors;
          break; // 최종 실패 시 루프 탈출 (기존 text 유지 + warnings 추가)
        }

        attempt++;
        console.warn(`[gemini] validation failed -> retrying once`);
        console.warn(
          `[gemini] Errors: ${allErrors.slice(0, 2).join(", ")}${allErrors.length > 2 ? "..." : ""}`
        );

        const repairInstruction = `\n\n[🚨 REPAIR INSTRUCTION 🚨]\n직전 출력에서 다음과 같은 규칙 위반이 있었습니다:\n${allErrors.map((e) => "- " + e).join("\n")}\n\n위 사항을 반드시 수정하여 전체 교안을 다시 작성하세요. 다른 내용은 잘 된 부분을 그대로 유지하십시오.`;

        response = await ai.models.generateContent({
          model: MODEL_NAME,
          config: {
            systemInstruction: systemPrompt + repairInstruction,
          },
          contents: passage,
        });
        text = extractText(response);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[gemini] <<< Success! Took ${duration}s, output: ${text.length} chars`
    );

    return { outputText: text.trim(), warnings: finalWarnings };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[gemini] !!! Failed after ${duration}s:`, error.message);
    throw error;
  }
}

module.exports = {
  MODEL_NAME,
  getAuthMode,
  createGeminiClient,
  generateOnePassage,
};
