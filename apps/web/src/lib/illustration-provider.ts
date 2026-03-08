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

export interface ProviderGenerateInput {
  scene: string;
  profile: IllustrationProfile;
  quality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  referenceImage?: IllustrationReferenceImage;
  seed?: number;
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

export function buildIllustrationPrompt(payload: ProviderGenerateInput): string {
  const profile = payload.profile;
  const banned = Array.isArray(profile.bannedKeywords)
    ? profile.bannedKeywords.join(", ")
    : "";

  return [
    "Create a clean educational illustration for a worksheet.",
    `Scene: ${payload.scene.trim().slice(0, 1200)}`,
    `Style: ${profile.styleName.trim()}`,
    `Character guide: ${profile.characterGuide.trim()}`,
    `Palette: ${profile.palette.trim()}`,
    `Line style: ${profile.lineStyle.trim()}`,
    `Mood: ${profile.mood.trim()}`,
    profile.negativePrompt ? `Negative prompt: ${profile.negativePrompt.trim()}` : "",
    banned ? `Avoid keywords: ${banned}` : "",
    payload.referenceImage
      ? "A reference style image is provided. Preserve visual style (line, palette, mood) but generate new content from Scene."
      : "",
    "All text and labels inside the image MUST be in Korean (한국어). No watermark.",
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
