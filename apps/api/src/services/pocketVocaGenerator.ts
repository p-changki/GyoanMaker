import { GoogleGenAI } from "@google/genai";
import {
  repairPocketVocaOutput,
  validatePocketVocaOutput,
  type PocketVocaOutput,
} from "../validation/pocketVoca";

const PRO_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const FLASH_MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";
const RETRY_MAX = 3;
const RETRY_BASE_DELAY_MS = 10_000;
const REPAIR_MAX_ATTEMPTS = 1;
const REPAIR_DELAY_MS = Number(process.env.REPAIR_DELAY_MS) || 0;

export interface PocketVocaTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface PocketVocaPassageInput {
  passageId: string;
  sentences: string[];
}

export interface PocketVocaGenerationResult {
  passages: PocketVocaOutput["passages"];
  usage: PocketVocaTokenUsage;
}

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
    typeof error === "object" &&
    error !== null &&
    typeof Reflect.get(error, "message") === "string"
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
          `[pocket-voca] 429 rate limited -> waiting ${delay / 1000}s before retry ${i + 1}/${RETRY_MAX}`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw new Error("[pocket-voca] Exhausted retries without response.");
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
  } catch {
    return "";
  }
}

function extractUsage(response: unknown): PocketVocaTokenUsage {
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

    return { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
  } catch {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }
}

function mergeUsage(a: PocketVocaTokenUsage, b: PocketVocaTokenUsage): PocketVocaTokenUsage {
  return {
    inputTokens: (a.inputTokens || 0) + (b.inputTokens || 0),
    outputTokens: (a.outputTokens || 0) + (b.outputTokens || 0),
    totalTokens: (a.totalTokens || 0) + (b.totalTokens || 0),
  };
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const payload = (fenceMatch?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function formatPassagesInput(passages: PocketVocaPassageInput[]): string {
  return JSON.stringify(
    {
      passages: passages.map((passage) => ({
        passageId: passage.passageId,
        sentences: passage.sentences.map((sentence, index) => ({
          index: index + 1,
          text: sentence,
        })),
      })),
    },
    null,
    2
  );
}

export async function generatePocketVoca(
  ai: GoogleGenAI,
  systemPrompt: string,
  passages: PocketVocaPassageInput[],
  model: "pro" | "flash"
): Promise<PocketVocaGenerationResult> {
  const modelName = model === "flash" ? FLASH_MODEL_NAME : PRO_MODEL_NAME;
  const content = formatPassagesInput(passages);
  const validPassageIds = passages.map((p) => p.passageId);

  let totalUsage: PocketVocaTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

  let response = await callWithRetry(ai, {
    model: modelName,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      temperature: 0.3,
    },
    contents: content,
  });

  totalUsage = mergeUsage(totalUsage, extractUsage(response));

  let repaired = repairPocketVocaOutput(parseJson(extractText(response)), validPassageIds);
  let validation = validatePocketVocaOutput(repaired, validPassageIds);

  let attempt = 0;
  while (!validation.valid && attempt < REPAIR_MAX_ATTEMPTS) {
    attempt += 1;

    console.warn("[pocket-voca] output validation failed; retrying repair");
    await sleep(REPAIR_DELAY_MS);

    const repairInstruction = `\n\n[REPAIR INSTRUCTION]\nYour previous JSON violated constraints:\n${validation.errors
      .slice(0, 10)
      .map((error) => `- ${error}`)
      .join("\n")}\n\nRegenerate one valid PocketVoca JSON object only.`;

    response = await callWithRetry(ai, {
      model: modelName,
      config: {
        systemInstruction: `${systemPrompt}${repairInstruction}`,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
      contents: content,
    });

    totalUsage = mergeUsage(totalUsage, extractUsage(response));
    repaired = repairPocketVocaOutput(parseJson(extractText(response)), validPassageIds);
    validation = validatePocketVocaOutput(repaired, validPassageIds);
  }

  if (!validation.valid) {
    throw new Error(
      `Pocket voca validation failed: ${validation.errors.slice(0, 3).join("; ")}`
    );
  }

  return { passages: repaired.passages, usage: totalUsage };
}
