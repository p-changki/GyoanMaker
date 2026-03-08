import { GoogleGenAI } from "@google/genai";
import type {
  IllustrationAspectRatio,
  IllustrationProfile,
  IllustrationQuality,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";
import { getDb } from "./firebase-admin";
import { readIllustrationImageBase64 } from "./firebase-storage";

const MODEL_DEFAULT =
  process.env.ILLUSTRATION_MODEL_DEFAULT || "gemini-3.1-flash-image-preview";
const MODEL_HQ =
  process.env.ILLUSTRATION_MODEL_HQ || "gemini-3-pro-image-preview";
const SCENE_ANALYSIS_MODEL = "gemini-2.5-flash";

export interface SceneAnalysis {
  /** English scene description for the image model */
  sceneDescription: string;
  /** Korean title text for top banner */
  titleBanner: string;
  /** Korean speech bubble contents */
  speechBubbles: { character: string; text: string; emotion: string }[];
  /** Korean keyword labels */
  keywordLabels: { keyword: string; description: string }[];
  /** Korean summary caption for bottom */
  captionText: string;
  /** Background setting description */
  background: string;
}

export interface ProviderGenerateInput {
  scene: string;
  profile: IllustrationProfile;
  quality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  referenceImage?: IllustrationReferenceImage;
  seed?: number;
  sceneAnalysis?: SceneAnalysis;
}

export interface ProviderGenerateOutput {
  imageBase64: string;
  mimeType?: string;
  revisedPrompt?: string;
  model?: string;
  seed?: number;
}

export function getQualityModel(quality: IllustrationQuality): string {
  return quality === "hq" ? MODEL_HQ : MODEL_DEFAULT;
}

export function allowPlaceholderOutput(): boolean {
  if (process.env.ILLUSTRATION_ALLOW_PLACEHOLDER === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function buildPlaceholderOutput(scene: string): ProviderGenerateOutput {
  const safeScene = scene.replace(/[<>&]/g, " ").slice(0, 140);
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768"><rect width="100%" height="100%" fill="#FFF6EC"/><rect x="48" y="48" width="928" height="672" rx="24" fill="#F9D9B9"/><text x="80" y="120" font-size="42" font-family="sans-serif" fill="#9A572F">Illustration Placeholder</text><text x="80" y="186" font-size="26" font-family="sans-serif" fill="#4B5563">${safeScene}</text></svg>`;

  return {
    imageBase64: Buffer.from(placeholderSvg, "utf8").toString("base64"),
    mimeType: "image/svg+xml",
    revisedPrompt: scene,
    model: "placeholder",
  };
}

function buildProfileStyleBlock(profile: ProviderGenerateInput["profile"]): string {
  const parts: string[] = ["**Style:**"];

  if (profile.styleName) {
    parts.push(`Art style: ${profile.styleName}.`);
  }
  if (profile.palette) {
    parts.push(`Color palette: ${profile.palette}.`);
  }
  if (profile.lineStyle) {
    parts.push(`Line style: ${profile.lineStyle}.`);
  }
  if (profile.characterGuide) {
    parts.push(`Character design: ${profile.characterGuide}.`);
  }

  // If no profile settings are filled, provide a minimal fallback
  if (parts.length === 1) {
    parts.push("Clean, appealing educational illustration style.");
  }

  return parts.join(" ");
}

function buildTextWithLayoutInstructions(includeText: boolean, profile?: IllustrationProfile): string[] {
  if (includeText) {
    return [
      "**Structured Scene Layout:**",
      "1. **Title banner (top):** A prominent banner or speech bubble at the top with a single Korean sentence summarizing the passage theme.",
      `2. **Character speech bubbles:** Draw exactly ${profile?.bubbleCount ?? 3} ${{ round: "round/oval", square: "rectangular", cloud: "cloud-shaped" }[profile?.bubbleStyle ?? "round"]} speech bubbles with Korean text.${(profile?.customBubbleTexts ?? []).length > 0 ? ` Use these EXACT texts: ${(profile?.customBubbleTexts ?? []).map((t: string, i: number) => `${i + 1}. "${t}"`).join(", ")}.` : ""}`,
      "3. **Keyword labels:** Arrows or annotation labels pointing to key concepts in the illustration, written in Korean.",
      "4. **Summary caption (bottom):** A rectangular caption box at the bottom with a Korean sentence that wraps up the scene or gives a lesson.",
      "5. **Background:** The background setting should match the passage context.",
      "",
      "All text inside the image MUST be in Korean (\ud55c\uad6d\uc5b4).",
    ];
  }

  return [
    "**Pure illustration \u2014 NO text allowed:**",
    "Do NOT include any text, speech bubbles, labels, captions, annotations, or letters inside the image.",
    "Express the meaning purely through visual storytelling, character expressions, symbolic elements, and background setting.",
  ];
}

function buildAnalyzedTextInstructions(analysis: SceneAnalysis): string[] {
  const lines: string[] = [
    "**Structured Scene Layout with pre-analyzed Korean text:**",
    `1. **Title banner (top):** Display this exact Korean text in a prominent banner: "${analysis.titleBanner}"`,
  ];

  if (analysis.speechBubbles.length > 0) {
    lines.push("2. **Character speech bubbles:**");
    for (const bubble of analysis.speechBubbles) {
      lines.push(`   - ${bubble.character}: "${bubble.text}" (${bubble.emotion})`);
    }
  }

  if (analysis.keywordLabels.length > 0) {
    lines.push("3. **Keyword labels:**");
    for (const label of analysis.keywordLabels) {
      lines.push(`   - ${label.keyword} \u2192 ${label.description}`);
    }
  }

  lines.push(
    `4. **Summary caption (bottom):** Display this exact Korean text in a caption box: "${analysis.captionText}"`,
    `5. **Background:** ${analysis.background}`,
    "",
    "All text inside the image MUST be in Korean (\ud55c\uad6d\uc5b4). Use the exact Korean text provided above."
  );

  return lines;
}

export function buildIllustrationPrompt(payload: ProviderGenerateInput): string {
  const profile = payload.profile;
  const banned = Array.isArray(profile.bannedKeywords)
    ? profile.bannedKeywords.join(", ")
    : "";
  const includeText = profile.includeKoreanText ?? false;
  const styleBlock = buildProfileStyleBlock(profile);
  const analysis = payload.sceneAnalysis;

  // Use analyzed scene description when available, otherwise fall back to raw scene text
  const sceneText = analysis
    ? analysis.sceneDescription.trim().slice(0, 1200)
    : payload.scene.trim().slice(0, 1200);

  // Use analyzed text instructions when available and Korean text is enabled
  const textInstructions =
    analysis && includeText && analysis.titleBanner
      ? buildAnalyzedTextInstructions(analysis)
      : buildTextWithLayoutInstructions(includeText, profile);

  const moodLine = profile.mood
    ? `**Mood:** ${profile.mood}. Add small decorative elements relevant to the scene.`
    : "**Mood:** Warm, friendly, and educational atmosphere. Add small decorative elements like hearts, sparkles, or relevant icons.";

  return [
    "Create a single-panel educational illustration that visually explains the passage content in an easy-to-understand way.",
    "",
    styleBlock,
    "",
    "**Scene (based on passage):**",
    `Depict the main theme of the following passage as a concrete scene with characters and setting: ${sceneText}`,
    "",
    ...textInstructions,
    "",
    moodLine,
    "",
    profile.negativePrompt ? `Negative prompt: ${profile.negativePrompt.trim()}` : "",
    banned ? `Avoid keywords: ${banned}` : "",
    payload.referenceImage
      ? "A reference style image is provided. Preserve the visual style (line weight, palette, character proportions) but generate new scene content."
      : "",
    "No watermark. No photorealistic elements.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildImageConfig(
  aspectRatio: IllustrationAspectRatio
): { width: number; height: number } {
  const baseWidth = 1024;
  if (aspectRatio === "1:1") return { width: baseWidth, height: baseWidth };
  if (aspectRatio === "16:9") return { width: baseWidth, height: 576 };
  return { width: baseWidth, height: 768 };
}

export function extractText(response: unknown): string {
  if (
    response &&
    typeof response === "object" &&
    typeof Reflect.get(response, "text") === "string"
  ) {
    return String(Reflect.get(response, "text"));
  }
  return "";
}

export function extractInlineImage(
  response: unknown
): { mimeType: string; data: string } | null {
  const queue: unknown[] = [response];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;

    const obj = current as Record<string, unknown>;
    const inlineData = (obj.inlineData ?? obj.inline_data) as
      | { mimeType?: unknown; mime_type?: unknown; data?: unknown }
      | undefined;
    if (inlineData && typeof inlineData.data === "string") {
      const mimeType =
        typeof inlineData.mimeType === "string"
          ? inlineData.mimeType
          : typeof inlineData.mime_type === "string"
            ? inlineData.mime_type
            : "image/png";
      return { mimeType, data: inlineData.data };
    }

    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        for (const entry of value) queue.push(entry);
      } else if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Stage 1: Passage Scene Analysis (Text -> Structured Scene Description)
// ---------------------------------------------------------------------------

function getAnalysisApiKey(): string | null {
  return process.env.GOOGLE_IMAGE_API_KEY || process.env.GOOGLE_API_KEY || null;
}

function buildAnalysisSystemPrompt(
  profile: IllustrationProfile,
  conceptMode?: string,
  conceptText?: string
): string {
  const includeText = profile.includeKoreanText ?? false;

  const analysisCount = profile.bubbleCount ?? 3;
  const textSection = includeText
    ? [
        "Generate all text elements in Korean (\ud55c\uad6d\uc5b4):",
        "- titleBanner: One impactful Korean sentence summarizing the passage theme (max 30 chars)",
        `- speechBubbles: ${analysisCount} character reactions with emotions in Korean. Each entry: { "character": "...", "text": "...", "emotion": "..." }`,
        '- keywordLabels: 2-4 key concept labels in Korean. Each entry: { "keyword": "...", "description": "..." }',
        "- captionText: One Korean wrap-up sentence (max 50 chars)",
      ].join("\n")
    : [
        "The user does NOT want any text in the illustration.",
        'Set titleBanner to "", speechBubbles to [], keywordLabels to [], captionText to "".',
      ].join("\n");

  const conceptSection = (() => {
    if (!conceptText || !conceptMode || conceptMode === "off") return "";
    if (conceptMode === "soft") {
      return `\nUse this as style inspiration for the scene: "${conceptText}"`;
    }
    return [
      "",
      "=== CHARACTER CONCEPT (MANDATORY) ===",
      `ALL characters MUST follow this concept: "${conceptText}".`,
      "If the concept describes animals, ONLY draw anthropomorphic animals \u2014 NEVER humans.",
      "If the concept describes robots, ONLY draw robots \u2014 NEVER humans.",
      "=== END ===",
    ].join("\n");
  })();

  const characterGuideLine = profile.characterGuide
    ? `\nCharacter design reference: ${profile.characterGuide}`
    : "";

  return [
    "You are an educational illustration scene designer. Analyze the following English passage and create a detailed scene description for an illustrator.",
    "",
    textSection,
    "",
    "Always generate:",
    "- sceneDescription: A vivid English description of the scene to draw (setting, characters, actions, composition). Max 400 chars.",
    "- background: The setting/location description in English. Max 100 chars.",
    conceptSection,
    characterGuideLine,
    "",
    "Respond with ONLY valid JSON matching this schema:",
    '{ "sceneDescription": "...", "titleBanner": "...", "speechBubbles": [...], "keywordLabels": [...], "captionText": "...", "background": "..." }',
    "No markdown fences, no extra text.",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function parseSceneAnalysisResponse(text: string): SceneAnalysis | null {
  try {
    const cleaned = text
      .replace(/```(?:json)?\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const sceneDescription =
      typeof parsed.sceneDescription === "string"
        ? parsed.sceneDescription.trim().slice(0, 500)
        : "";
    const titleBanner =
      typeof parsed.titleBanner === "string"
        ? parsed.titleBanner.trim().slice(0, 60)
        : "";
    const captionText =
      typeof parsed.captionText === "string"
        ? parsed.captionText.trim().slice(0, 100)
        : "";
    const background =
      typeof parsed.background === "string"
        ? parsed.background.trim().slice(0, 200)
        : "";

    const speechBubbles = Array.isArray(parsed.speechBubbles)
      ? (parsed.speechBubbles as Record<string, unknown>[])
          .filter(
            (b) =>
              typeof b.character === "string" &&
              typeof b.text === "string" &&
              typeof b.emotion === "string"
          )
          .map((b) => ({
            character: String(b.character).slice(0, 40),
            text: String(b.text).slice(0, 80),
            emotion: String(b.emotion).slice(0, 30),
          }))
          .slice(0, 5)
      : [];

    const keywordLabels = Array.isArray(parsed.keywordLabels)
      ? (parsed.keywordLabels as Record<string, unknown>[])
          .filter(
            (l) =>
              typeof l.keyword === "string" && typeof l.description === "string"
          )
          .map((l) => ({
            keyword: String(l.keyword).slice(0, 40),
            description: String(l.description).slice(0, 80),
          }))
          .slice(0, 6)
      : [];

    if (!sceneDescription) return null;

    return {
      sceneDescription,
      titleBanner,
      speechBubbles,
      keywordLabels,
      captionText,
      background,
    };
  } catch {
    return null;
  }
}

function buildFallbackAnalysis(rawText: string): SceneAnalysis {
  return {
    sceneDescription: rawText.replace(/\s+/g, " ").trim().slice(0, 400),
    titleBanner: "",
    speechBubbles: [],
    keywordLabels: [],
    captionText: "",
    background: "",
  };
}

/**
 * Stage 1 of the 2-stage illustration pipeline.
 * Uses Gemini text model to analyze the passage and produce a structured
 * scene description with optional Korean text elements.
 */
export async function analyzePassageScene(
  rawText: string,
  profile: IllustrationProfile,
  conceptMode?: string,
  conceptText?: string
): Promise<SceneAnalysis> {
  const apiKey = getAnalysisApiKey();

  if (!apiKey) {
    if (allowPlaceholderOutput()) {
      console.warn("[illustrations] No API key for scene analysis \u2014 returning fallback.");
      return buildFallbackAnalysis(rawText);
    }
    throw new Error("Scene analysis requires GOOGLE_IMAGE_API_KEY or GOOGLE_API_KEY.");
  }

  const passageSlice = rawText.replace(/\s+/g, " ").trim().slice(0, 2000);
  if (!passageSlice) {
    return buildFallbackAnalysis(rawText);
  }

  const systemPrompt = buildAnalysisSystemPrompt(profile, conceptMode, conceptText);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: SCENE_ANALYSIS_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `\nPassage:\n${passageSlice}` },
          ],
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = (response as any).candidates?.[0]?.content?.parts ?? [];
    const responseText = parts
      .filter((p: { text?: string }) => typeof p.text === "string")
      .map((p: { text: string }) => p.text)
      .join("");

    if (!responseText) {
      console.warn("[illustrations] Scene analysis returned empty response \u2014 using fallback.");
      return buildFallbackAnalysis(rawText);
    }

    const analysis = parseSceneAnalysisResponse(responseText);
    if (!analysis) {
      console.warn("[illustrations] Failed to parse scene analysis \u2014 using fallback.");
      return buildFallbackAnalysis(rawText);
    }

    return analysis;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[illustrations] Scene analysis failed: ${message}`);
    return buildFallbackAnalysis(rawText);
  }
}

// ---------------------------------------------------------------------------
// Stage 2: Image Generation
// ---------------------------------------------------------------------------

export async function requestProviderImage(
  payload: ProviderGenerateInput
): Promise<ProviderGenerateOutput> {
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY;

  if (!apiKey) {
    if (!allowPlaceholderOutput()) {
      throw new Error(
        "Illustration provider is not configured. Set GOOGLE_IMAGE_API_KEY."
      );
    }

    return buildPlaceholderOutput(payload.scene);
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildIllustrationPrompt(payload);
  const imageConfig = buildImageConfig(payload.aspectRatio);
  const model = getQualityModel(payload.quality);
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (payload.referenceImage?.storagePath) {
    try {
      const refImage = await readIllustrationImageBase64(
        payload.referenceImage.storagePath
      );
      parts.push({
        inlineData: {
          mimeType: refImage.mimeType,
          data: refImage.data,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[illustrations] reference image skipped: ${message}`);
    }
  }

  const response = await ai.models.generateContent({
    model,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig,
    },
    contents: [{ role: "user", parts }],
  } as never);

  const inline = extractInlineImage(response);
  if (!inline) {
    throw new Error("Illustration provider returned no image data.");
  }

  return {
    imageBase64: inline.data,
    mimeType: inline.mimeType,
    revisedPrompt: extractText(response) || prompt,
    model,
    seed: payload.seed,
  };
}

export async function logIllustrationUsage(params: {
  email: string;
  jobId: string;
  handoutId: string;
  passageId: string;
  quality: IllustrationQuality;
  model: string;
  status: "completed" | "failed";
  latencyMs: number;
  errorCode?: string;
}): Promise<void> {
  await getDb()
    .collection("illustration_usage_logs")
    .add({
      email: params.email.toLowerCase(),
      jobId: params.jobId,
      handoutId: params.handoutId,
      passageId: params.passageId,
      quality: params.quality,
      model: params.model,
      status: params.status,
      latencyMs: params.latencyMs,
      errorCode: params.errorCode ?? null,
      createdAt: new Date().toISOString(),
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[illustrations] usage log failed: ${message}`);
    });
}
