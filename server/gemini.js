const { GoogleGenAI } = require("@google/genai");
const { validateOutputText } = require("./validators/validateOutput");
const { validateVocabText } = require("./validators/validateVocab");

const ENABLE_REPAIR = process.env.ENABLE_REPAIR !== "false";

function getRepairMaxAttempts() {
  const raw = Number(process.env.REPAIR_MAX_ATTEMPTS || "1");
  if (!Number.isFinite(raw)) {
    return 1;
  }

  const parsed = Math.floor(raw);
  return Math.max(0, Math.min(3, parsed)); // 0~3 범위로 제한 (clamp 관용 패턴)
}

const REPAIR_MAX_ATTEMPTS = getRepairMaxAttempts();

// 환경변수에서 모델명을 가져오거나 기본값으로 gemini-2.5-pro 사용
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const FLASH_MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";

// 429 retry configuration
const RETRY_MAX = 3;
const RETRY_BASE_DELAY_MS = 10_000; // 10s initial backoff
const REPAIR_DELAY_MS = Number(process.env.REPAIR_DELAY_MS) || 15_000; // 15s delay before repair
const FLASH_REPAIR_DELAY_MS =
  Number(process.env.FLASH_REPAIR_DELAY_MS) || 5_000; // 5s for flash mode

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function is429Error(error) {
  if (error?.status === 429 || error?.code === 429) return true;
  const msg = error?.message || "";
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

/**
 * Gemini API call with exponential backoff for 429 errors.
 */
async function callWithRetry(ai, config) {
  for (let i = 0; i <= RETRY_MAX; i++) {
    try {
      return await ai.models.generateContent(config);
    } catch (error) {
      if (is429Error(error) && i < RETRY_MAX) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, i);
        console.warn(
          `[gemini] 429 rate limited -> waiting ${delay / 1000}s before retry ${i + 1}/${RETRY_MAX}`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
}

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
 * 응답 객체에서 토큰 사용량 메타데이터를 추출한다.
 * @returns {{ inputTokens: number, outputTokens: number, totalTokens: number }}
 */
function extractUsage(response) {
  try {
    const meta = response?.usageMetadata;
    if (!meta) return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    const inputTokens = meta.promptTokenCount ?? meta.inputTokens ?? 0;
    const outputTokens = meta.candidatesTokenCount ?? meta.outputTokens ?? 0;
    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };
  } catch {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
}

/**
 * 두 usage 객체를 합산한다 (immutable).
 */
function mergeUsage(a, b) {
  return {
    inputTokens: (a.inputTokens || 0) + (b.inputTokens || 0),
    outputTokens: (a.outputTokens || 0) + (b.outputTokens || 0),
    totalTokens: (a.totalTokens || 0) + (b.totalTokens || 0),
  };
}

/**
 * 단일 지문에 대한 교안을 생성한다.
 *
 * @param {object} ai - Gemini client
 * @param {string} systemPrompt - level에 맞는 시스템 프롬프트 (호출자가 결정)
 * @param {string} passage - 영어 지문
 * @param {object} options
 * @param {string} options.model - "pro" | "flash" (Gemini 모델 선택)
 * @param {string} options.level - "advanced" | "basic" (검증 임계값 결정)
 */
async function generateOnePassage(
  ai,
  systemPrompt,
  passage,
  { model = "pro", level = "advanced" } = {}
) {
  const startTime = Date.now();
  const authMode = getAuthMode();
  const isFlash = model === "flash";
  const modelName = isFlash ? FLASH_MODEL_NAME : MODEL_NAME;
  const repairDelay = isFlash ? FLASH_REPAIR_DELAY_MS : REPAIR_DELAY_MS;

  console.log(
    `[gemini] >>> Start generating with ${modelName} (authMode: ${authMode}, level: ${level}, model: ${model})`
  );

  console.log(
    `[gemini] systemPrompt length: ${systemPrompt?.length || 0} chars`
  );

  try {
    let response = await callWithRetry(ai, {
      model: modelName,
      config: {
        systemInstruction: systemPrompt,
      },
      contents: passage,
    });

    let text = extractText(response);
    let totalUsage = extractUsage(response);
    let finalWarnings = [];

    if (ENABLE_REPAIR) {
      let attempt = 0;
      while (attempt <= REPAIR_MAX_ATTEMPTS) {
        // Validate using level-based thresholds
        const outRes = validateOutputText("check", text, level);
        const vocabRes = validateVocabText("check", text, level);

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

        const repairErrors = allErrors.slice(0, 8);
        const repairInstruction = `\n\n[REPAIR INSTRUCTION]\n직전 출력의 규칙 위반 항목:\n${repairErrors.map((e) => "- " + e).join("\n")}\n\n위반된 섹션(Topic/Summary/Core Vocabulary)만 교정하고, 이미 규칙을 만족한 다른 섹션은 변경하지 마십시오.`;

        console.log(
          `[gemini] waiting ${repairDelay / 1000}s before repair call...`
        );
        await sleep(repairDelay);

        response = await callWithRetry(ai, {
          model: modelName,
          config: {
            systemInstruction: systemPrompt + repairInstruction,
          },
          contents: passage,
        });
        text = extractText(response);
        totalUsage = mergeUsage(totalUsage, extractUsage(response));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[gemini] <<< Success! Took ${duration}s, output: ${text.length} chars, tokens: ${totalUsage.totalTokens}`
    );

    return {
      outputText: text.trim(),
      warnings: finalWarnings,
      usage: totalUsage,
    };
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
