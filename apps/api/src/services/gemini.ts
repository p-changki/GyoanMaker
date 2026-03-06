import { GoogleGenAI } from "@google/genai";
import { validateOutputText } from "../validation/output";
import { validateVocabText } from "../validation/vocab";

const ENABLE_REPAIR = process.env.ENABLE_REPAIR !== "false";

function getRepairMaxAttempts(): number {
  const raw = Number(process.env.REPAIR_MAX_ATTEMPTS || "1");
  if (!Number.isFinite(raw)) {
    return 1;
  }

  const parsed = Math.floor(raw);
  return Math.max(0, Math.min(3, parsed));
}

const REPAIR_MAX_ATTEMPTS = getRepairMaxAttempts();

export const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const FLASH_MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";

const RETRY_MAX = 3;
const RETRY_BASE_DELAY_MS = 10_000;
const REPAIR_DELAY_MS = Number(process.env.REPAIR_DELAY_MS) || 15_000;
const FLASH_REPAIR_DELAY_MS = Number(process.env.FLASH_REPAIR_DELAY_MS) || 5_000;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface GenerationResult {
  outputText: string;
  warnings: string[];
  usage: TokenUsage;
}

type ContentLevel = "advanced" | "basic";
type ModelTier = "pro" | "flash";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function is429Error(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    (Reflect.get(error, "status") === 429 || Reflect.get(error, "code") === 429)
  ) {
    return true;
  }

  const message =
    typeof error === "object" && error !== null && typeof Reflect.get(error, "message") === "string"
      ? (Reflect.get(error, "message") as string)
      : "";

  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
}

async function callWithRetry(ai: GoogleGenAI, config: object): Promise<unknown> {
  for (let i = 0; i <= RETRY_MAX; i += 1) {
    try {
      return await ai.models.generateContent(config as never);
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

  throw new Error("[gemini] Exhausted retries without response.");
}

export function getAuthMode(): "vertex" | "apikey" | null {
  if (process.env.GOOGLE_CLOUD_PROJECT) return "vertex";
  if (process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY) {
    return "apikey";
  }
  return null;
}

export function createGeminiClient(): GoogleGenAI {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY;

  if (project) {
    return new GoogleGenAI({ vertexai: true, project, location });
  }

  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  throw new Error(
    "[gemini] 인증 정보가 없습니다. " +
      "Cloud Run 운영: GOOGLE_CLOUD_PROJECT 환경변수 필요. " +
      "로컬 개발: GOOGLE_API_KEY 또는 GOOGLE_CLOUD_API_KEY 환경변수 필요."
  );
}

function extractText(response: unknown): string {
  try {
    if (
      typeof response === "object" &&
      response !== null &&
      typeof Reflect.get(response, "text") === "string"
    ) {
      return Reflect.get(response, "text") as string;
    }

    if (
      typeof response === "object" &&
      response !== null &&
      typeof Reflect.get(response, "text") === "function"
    ) {
      return String((Reflect.get(response, "text") as () => string)());
    }

    const candidates =
      typeof response === "object" && response !== null
        ? (Reflect.get(response, "candidates") as Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>)
        : undefined;

    return candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[gemini] Error extracting text:", message);
    return "";
  }
}

function extractUsage(response: unknown): TokenUsage {
  try {
    if (typeof response !== "object" || response === null) {
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }

    const meta = Reflect.get(response, "usageMetadata") as
      | {
          promptTokenCount?: number;
          inputTokens?: number;
          candidatesTokenCount?: number;
          outputTokens?: number;
        }
      | undefined;

    if (!meta) {
      return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    }

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

function mergeUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: (a.inputTokens || 0) + (b.inputTokens || 0),
    outputTokens: (a.outputTokens || 0) + (b.outputTokens || 0),
    totalTokens: (a.totalTokens || 0) + (b.totalTokens || 0),
  };
}

export async function generateOnePassage(
  ai: GoogleGenAI,
  systemPrompt: string,
  passage: string,
  options: { model?: ModelTier; level?: ContentLevel } = {}
): Promise<GenerationResult> {
  const startTime = Date.now();
  const authMode = getAuthMode();
  const model = options.model ?? "pro";
  const level = options.level ?? "advanced";
  const isFlash = model === "flash";
  const modelName = isFlash ? FLASH_MODEL_NAME : MODEL_NAME;
  const repairDelay = isFlash ? FLASH_REPAIR_DELAY_MS : REPAIR_DELAY_MS;

  console.log(
    `[gemini] >>> Start generating with ${modelName} (authMode: ${authMode}, level: ${level}, model: ${model})`
  );
  console.log(`[gemini] systemPrompt length: ${systemPrompt?.length || 0} chars`);

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
    let finalWarnings: string[] = [];

    if (ENABLE_REPAIR) {
      let attempt = 0;
      while (attempt <= REPAIR_MAX_ATTEMPTS) {
        const outRes = validateOutputText("check", text, level);
        const vocabRes = validateVocabText("check", text, level);

        const allErrors = [...outRes.errors, ...vocabRes.errors];
        if (allErrors.length === 0) {
          if (attempt > 0) {
            console.log("[gemini] <<< Retry success!");
          }
          break;
        }

        if (attempt >= REPAIR_MAX_ATTEMPTS) {
          console.warn("[gemini] !!! Retry failed. Returns with warnings.");
          console.warn(
            `[gemini] Errors: ${allErrors.slice(0, 2).join(", ")}${allErrors.length > 2 ? "..." : ""}`
          );
          finalWarnings = allErrors;
          break;
        }

        attempt += 1;
        console.warn("[gemini] validation failed -> retrying once");
        console.warn(
          `[gemini] Errors: ${allErrors.slice(0, 2).join(", ")}${allErrors.length > 2 ? "..." : ""}`
        );

        const repairErrors = allErrors.slice(0, 8);
        const repairInstruction = `\n\n[REPAIR INSTRUCTION]\n직전 출력의 규칙 위반 항목:\n${repairErrors
          .map((error) => `- ${error}`)
          .join("\n")}\n\n위반된 섹션(Topic/Summary/Core Vocabulary)만 교정하고, 이미 규칙을 만족한 다른 섹션은 변경하지 마십시오.`;

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
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[gemini] !!! Failed after ${duration}s:`, message);
    throw error;
  }
}
