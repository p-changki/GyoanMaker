import { GoogleGenAI } from "@google/genai";
import { validateWorkbookOutput } from "../validation/workbook";

// NOTE: These types mirror @gyoanmaker/shared/types/workbook.ts.
// API package uses moduleResolution: "Node" which cannot resolve
// subpath exports from the shared package, so we define them locally.
// Keep in sync with packages/shared/src/types/workbook.ts.

export interface WorkbookChoice {
  correct: string;
  wrong: string;
}

export interface WorkbookStep2Item {
  sentenceIndex: number;
  questionNumber: number;
  sentenceTemplate: string;
  choices: WorkbookChoice[];
  answerKey: string[];
}

export interface WorkbookStep3Item {
  questionNumber: number;
  passageNumber: number;
  type: "3p" | "4p";
  intro: string;
  paragraphs: {
    label: string;
    text: string;
  }[];
  options: string[][];
  answerIndex: number;
}

export interface PassageWorkbook {
  passageId: string;
  passageTitle: string;
  step2Items: WorkbookStep2Item[];
  step3Items: WorkbookStep3Item[];
}

const PRO_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-pro";
const FLASH_MODEL_NAME = process.env.GEMINI_FLASH_MODEL || "gemini-2.5-flash";
const RETRY_MAX = 3;
const RETRY_BASE_DELAY_MS = 10_000;
const REPAIR_MAX_ATTEMPTS = 1;
const REPAIR_DELAY_MS = Number(process.env.REPAIR_DELAY_MS) || 0;

export interface WorkbookTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface WorkbookPassageInput {
  passageId: string;
  sentences: string[];
}

export interface WorkbookGenerationResult {
  passage: PassageWorkbook;
  usage: WorkbookTokenUsage;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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
          `[workbook] 429 rate limited -> waiting ${delay / 1000}s before retry ${i + 1}/${RETRY_MAX}`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw new Error("[workbook] Exhausted retries without response.");
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

function extractUsage(response: unknown): WorkbookTokenUsage {
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

function mergeUsage(a: WorkbookTokenUsage, b: WorkbookTokenUsage): WorkbookTokenUsage {
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

function toWrongCandidate(correct: string): string {
  const base = correct.trim();
  if (!base) return "wrong";
  if (base.endsWith("e")) return `${base}ing`;
  if (base.endsWith("s")) return `${base}ed`;
  return `${base}s`;
}

function createFallbackChoice(sentence: string): WorkbookChoice {
  const firstWord = sentence.trim().split(/\s+/).find(Boolean) ?? "word";
  const wrong = toWrongCandidate(firstWord);
  return {
    correct: firstWord,
    wrong: wrong === firstWord ? `${wrong}_wrong` : wrong,
  };
}

function normalizeStep2Items(
  raw: Record<string, unknown>,
  sentences: string[]
): WorkbookStep2Item[] {
  const rawItems = Array.isArray(raw.step2Items) ? raw.step2Items : [];

  return sentences.map((sentence, index) => {
    const source = isRecord(rawItems[index]) ? rawItems[index] : {};
    const rawChoices = Array.isArray(source.choices) ? source.choices : [];

    const normalizedChoices: WorkbookChoice[] = rawChoices
      .map((choice) => {
        if (!isRecord(choice)) return null;
        if (!isNonEmptyString(choice.correct)) return null;

        const correct = choice.correct.trim();
        const wrong = isNonEmptyString(choice.wrong)
          ? choice.wrong.trim()
          : toWrongCandidate(correct);

        return {
          correct,
          wrong: wrong === correct ? `${wrong}_wrong` : wrong,
        };
      })
      .filter((choice): choice is WorkbookChoice => choice !== null)
      .slice(0, 3);

    const choices =
      normalizedChoices.length > 0
        ? normalizedChoices
        : [createFallbackChoice(sentence)];

    const sentenceTemplate = isNonEmptyString(source.sentenceTemplate)
      ? source.sentenceTemplate.trim()
      : sentence;

    const sentenceIndex =
      Number.isInteger(source.sentenceIndex) &&
      (source.sentenceIndex as number) >= 0 &&
      (source.sentenceIndex as number) < sentences.length
        ? (source.sentenceIndex as number)
        : index;

    return {
      sentenceIndex,
      questionNumber: index + 1,
      sentenceTemplate,
      choices,
      answerKey: choices.map((choice) => choice.correct),
    };
  });
}

function permutations(items: string[]): string[][] {
  if (items.length <= 1) return [items];

  const result: string[][] = [];
  items.forEach((item, index) => {
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    const sub = permutations(rest);
    sub.forEach((entry) => {
      result.push([item, ...entry]);
    });
  });

  return result;
}

function createParagraphTexts(
  sentences: string[],
  desiredCount: number,
  intro: string
): string[] {
  const usable = sentences.slice(Math.min(2, sentences.length));
  const source = usable.length > 0 ? usable : [intro];
  const chunkSize = Math.max(1, Math.ceil(source.length / desiredCount));
  const texts: string[] = [];

  for (let i = 0; i < desiredCount; i += 1) {
    const start = i * chunkSize;
    const piece = source.slice(start, start + chunkSize).join(" ").trim();
    texts.push(piece || source[i % source.length] || intro);
  }

  return texts;
}

function normalizeStep3Item(
  source: Record<string, unknown>,
  itemIndex: number,
  passageNumber: number,
  sentences: string[]
): WorkbookStep3Item {
  const intro =
    isNonEmptyString(source.intro) && source.intro.trim().length > 0
      ? source.intro.trim()
      : sentences.slice(0, 2).join(" ").trim() || "Read the passage and choose the best order.";

  const labels = ["A", "B", "C", "D"];
  const rawParagraphs = Array.isArray(source.paragraphs) ? source.paragraphs : [];
  const inferredType = source.type === "4p" || rawParagraphs.length >= 4 ? "4p" : "3p";
  const desiredCount = inferredType === "4p" ? 4 : 3;
  const paragraphTexts = createParagraphTexts(sentences, desiredCount, intro);

  // Build paragraphs from AI output (in original/correct content order)
  const orderedParagraphs = Array.from({ length: desiredCount }, (_, index) => {
    const candidate = isRecord(rawParagraphs[index]) ? rawParagraphs[index] : null;
    const text = isNonEmptyString(candidate?.text)
      ? candidate.text.trim()
      : paragraphTexts[index];
    return text;
  });

  // Shuffle label assignment so the correct order isn't always A-B-C.
  // AI tends to output segments in natural (correct) order, so without
  // shuffling, the answer is almost always the alphabetical sequence.
  const activeLabels = labels.slice(0, desiredCount);
  const shuffledLabels = [...activeLabels].sort(() => Math.random() - 0.5);

  // Map: shuffled label → original content index
  // e.g. if shuffledLabels = ["C","A","B"], then label "C" gets content[0], "A" gets content[1], "B" gets content[2]
  const paragraphs = shuffledLabels.map((label, idx) => ({
    label,
    text: orderedParagraphs[idx],
  }));

  // The correct reading order maps back from content order → shuffled labels
  // Content[0] got shuffledLabels[0], Content[1] got shuffledLabels[1], etc.
  // So the correct display order is: shuffledLabels in original content order = shuffledLabels as-is
  const correctOrder = [...shuffledLabels];

  // Sort paragraphs alphabetically for display (A, B, C, D)
  paragraphs.sort((a, b) => a.label.localeCompare(b.label));

  // Generate distractors using adjacent-swap strategy (more plausible than random permutations)
  const allPerms = permutations([...activeLabels]);
  const correctKey = correctOrder.join("-");

  // Prefer adjacent swaps as distractors (swap neighbors in the correct order)
  const adjacentSwaps: string[][] = [];
  for (let i = 0; i < correctOrder.length - 1; i++) {
    const swapped = [...correctOrder];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    if (swapped.join("-") !== correctKey) {
      adjacentSwaps.push(swapped);
    }
  }

  const distractorPool: string[][] = [];
  const seen = new Set<string>();
  seen.add(correctKey);

  const pushDistractor = (value: string[]) => {
    const key = value.join("-");
    if (seen.has(key)) return;
    seen.add(key);
    distractorPool.push(value);
  };

  // Priority: adjacent swaps first, then remaining permutations
  adjacentSwaps.forEach(pushDistractor);
  allPerms.forEach(pushDistractor);

  // Pick 4 distractors, insert correct at random position
  const chosen = distractorPool.slice(0, 4);
  const insertPos = Math.floor(Math.random() * (chosen.length + 1));
  chosen.splice(insertPos, 0, correctOrder);
  const finalOptions = chosen.slice(0, 5);

  const answerIndex = finalOptions.findIndex(
    (option) => option.join("-") === correctKey
  );

  return {
    questionNumber: itemIndex + 1,
    passageNumber:
      Number.isInteger(source.passageNumber) && (source.passageNumber as number) > 0
        ? (source.passageNumber as number)
        : passageNumber,
    type: inferredType,
    intro,
    paragraphs,
    options: finalOptions,
    answerIndex: answerIndex >= 0 ? answerIndex : 0,
  };
}

function normalizeStep3Items(
  raw: Record<string, unknown>,
  passageNumber: number,
  sentences: string[]
): WorkbookStep3Item[] {
  const rawItems = Array.isArray(raw.step3Items) ? raw.step3Items : [];
  const candidates = rawItems
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .slice(0, 3);

  while (candidates.length < 1) {
    candidates.push({
      type: candidates.length % 2 === 0 ? "3p" : "4p",
      intro: sentences.slice(0, 2).join(" "),
      paragraphs: [],
      options: [],
      answerIndex: 0,
    });
  }

  return candidates.map((item, index) =>
    normalizeStep3Item(item, index, passageNumber, sentences)
  );
}

function normalizePassageWorkbook(
  parsed: unknown,
  passageData: WorkbookPassageInput
): PassageWorkbook {
  const source = isRecord(parsed) ? parsed : {};
  const passageNumberMatch = passageData.passageId.match(/\d+/);
  const passageNumber = passageNumberMatch
    ? Number.parseInt(passageNumberMatch[0], 10)
    : 1;

  const normalized: PassageWorkbook = {
    passageId: passageData.passageId,
    passageTitle: isNonEmptyString(source.passageTitle)
      ? source.passageTitle.trim()
      : passageData.passageId,
    step2Items: normalizeStep2Items(source, passageData.sentences),
    step3Items: normalizeStep3Items(source, passageNumber, passageData.sentences),
  };

  return normalized;
}

function formatPassageInput(passageData: WorkbookPassageInput): string {
  return JSON.stringify(
    {
      passageId: passageData.passageId,
      sentences: passageData.sentences.map((sentence, index) => ({
        index: index + 1,
        text: sentence,
      })),
    },
    null,
    2
  );
}

export async function generateWorkbookForPassage(
  ai: GoogleGenAI,
  systemPrompt: string,
  passageData: WorkbookPassageInput,
  model: "pro" | "flash"
): Promise<WorkbookGenerationResult> {
  const modelName = model === "flash" ? FLASH_MODEL_NAME : PRO_MODEL_NAME;
  const content = formatPassageInput(passageData);

  let totalUsage: WorkbookTokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };

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

  let parsed = parseJson(extractText(response));
  let normalized = normalizePassageWorkbook(parsed, passageData);
  let validation = validateWorkbookOutput(normalized, passageData.sentences.length);

  let attempt = 0;
  while (!validation.valid && attempt < REPAIR_MAX_ATTEMPTS) {
    attempt += 1;

    console.warn(
      `[workbook] output validation failed for ${passageData.passageId}; retrying repair`
    );
    await sleep(REPAIR_DELAY_MS);

    const repairInstruction = `\n\n[REPAIR INSTRUCTION]\nYour previous JSON violated constraints:\n${validation.errors
      .slice(0, 10)
      .map((error) => `- ${error}`)
      .join("\n")}\n\nRegenerate one valid PassageWorkbook JSON object only.`;

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
    parsed = parseJson(extractText(response));
    normalized = normalizePassageWorkbook(parsed, passageData);
    validation = validateWorkbookOutput(normalized, passageData.sentences.length);
  }

  if (!validation.valid) {
    throw new Error(
      `Workbook validation failed for ${passageData.passageId}: ${validation.errors
        .slice(0, 3)
        .join("; ")}`
    );
  }

  return {
    passage: normalized,
    usage: totalUsage,
  };
}
