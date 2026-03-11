import type {
  IllustrationJob,
  IllustrationJobItem,
  IllustrationProfile,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";

const PROFILE_ID = "default";
const DEFAULT_PROFILE: IllustrationProfile = {
  profileId: PROFILE_ID,
  styleEnabled: false,
  styleName: "",
  characterGuide: "",
  palette: "",
  lineStyle: "",
  mood: "",
  negativePrompt: "blurry, watermark, logo, text overlay, gore, nsfw",
  bannedKeywords: ["celebrity", "copyright character"],
  defaultQuality: "standard",
  aspectRatio: "16:9",
  updatedAt: new Date(0).toISOString(),
};

export { PROFILE_ID, DEFAULT_PROFILE };

export function nowIso(): string {
  return new Date().toISOString();
}

export function toSafeText(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

export function normalizeReferenceImage(
  raw: Partial<IllustrationReferenceImage> | null | undefined
): IllustrationReferenceImage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const imageUrl = toSafeText(raw.imageUrl, 2000, "");
  const storagePath = toSafeText(raw.storagePath, 500, "");
  if (!imageUrl || !storagePath) return undefined;

  const mimeType =
    raw.mimeType === "image/jpeg" || raw.mimeType === "image/webp"
      ? raw.mimeType
      : "image/png";
  const source = raw.source === "sample" ? "sample" : "upload";
  const width =
    typeof raw.width === "number" && Number.isFinite(raw.width) && raw.width > 0
      ? Math.round(raw.width)
      : undefined;
  const height =
    typeof raw.height === "number" && Number.isFinite(raw.height) && raw.height > 0
      ? Math.round(raw.height)
      : undefined;

  return {
    imageUrl,
    storagePath,
    mimeType,
    source,
    width,
    height,
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt.trim().length > 0
        ? raw.updatedAt
        : nowIso(),
  };
}

export function normalizeProfile(
  raw:
    | (Omit<Partial<IllustrationProfile>, "referenceImage"> & {
        referenceImage?: Partial<IllustrationReferenceImage> | null;
      })
    | undefined
): IllustrationProfile {
  const fallback = DEFAULT_PROFILE;
  const quality = raw?.defaultQuality;
  const aspectRatio = raw?.aspectRatio;
  const bannedKeywords = Array.isArray(raw?.bannedKeywords)
    ? raw?.bannedKeywords
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : fallback.bannedKeywords;
  const referenceImage = normalizeReferenceImage(raw?.referenceImage);
  return {
    profileId: PROFILE_ID,
    styleEnabled: false,
    styleName: toSafeText(raw?.styleName, 60, fallback.styleName),
    characterGuide: toSafeText(raw?.characterGuide, 300, fallback.characterGuide),
    palette: toSafeText(raw?.palette, 60, fallback.palette),
    lineStyle: toSafeText(raw?.lineStyle, 60, fallback.lineStyle),
    mood: toSafeText(raw?.mood, 60, fallback.mood),
    negativePrompt: toSafeText(raw?.negativePrompt, 400, fallback.negativePrompt),
    bannedKeywords,
    referenceImage,
    defaultQuality:
      quality === "draft" || quality === "standard" || quality === "hq"
        ? quality
        : fallback.defaultQuality,
    aspectRatio:
      aspectRatio === "1:1" || aspectRatio === "16:9" || aspectRatio === "4:3"
        ? aspectRatio
        : fallback.aspectRatio,
    updatedAt:
      typeof raw?.updatedAt === "string" && raw.updatedAt.length > 0
        ? raw.updatedAt
        : fallback.updatedAt,
  };
}

/**
 * Returns a stable hash of the profile fields that affect image generation.
 * Caller must supply the hashSha256 function to avoid circular deps.
 */
export function profileHash(
  profile: IllustrationProfile,
  hashSha256Fn: (value: string) => string
): string {
  return hashSha256Fn(
    JSON.stringify({
      styleName: profile.styleName,
      characterGuide: profile.characterGuide,
      palette: profile.palette,
      lineStyle: profile.lineStyle,
      mood: profile.mood,
      negativePrompt: profile.negativePrompt ?? "",
      bannedKeywords: profile.bannedKeywords ?? [],
      referenceImage: profile.referenceImage
        ? {
            storagePath: profile.referenceImage.storagePath,
            mimeType: profile.referenceImage.mimeType,
            source: profile.referenceImage.source,
          }
        : null,
      defaultQuality: profile.defaultQuality,
      aspectRatio: profile.aspectRatio,
    })
  );
}

export function normalizeJob(input: Partial<IllustrationJob>): IllustrationJob {
  const rawItems = input.items || {};
  const items = Object.fromEntries(
    Object.entries(rawItems).map(([passageId, item]) => {
      const rawItem = item as IllustrationJobItem;
      return [
        passageId,
        {
          ...rawItem,
          referenceImage: normalizeReferenceImage(rawItem.referenceImage),
        } satisfies IllustrationJobItem,
      ];
    })
  ) as Record<string, IllustrationJobItem>;
  return {
    id: input.id || "",
    handoutId: input.handoutId || "",
    referenceImage: normalizeReferenceImage(input.referenceImage),
    status: input.status || "queued",
    quality: input.quality || "standard",
    aspectRatio: input.aspectRatio || "16:9",
    total: input.total || 0,
    completed: input.completed || 0,
    failed: input.failed || 0,
    reservedCredits: input.reservedCredits || 0,
    consumedCredits: input.consumedCredits || 0,
    refundedCredits: input.refundedCredits || 0,
    failedRefundedAt: input.failedRefundedAt,
    overwritePolicy: input.overwritePolicy || "skip_completed",
    conceptMode: input.conceptMode,
    conceptText: input.conceptText,
    includeKoreanText: input.includeKoreanText ?? false,
    bubbleCount: input.bubbleCount,
    bubbleStyle: input.bubbleStyle,
    customBubbleTexts: input.customBubbleTexts,
    items,
    createdAt: input.createdAt || nowIso(),
    updatedAt: input.updatedAt || nowIso(),
  };
}

