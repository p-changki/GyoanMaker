import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import type {
  HandoutIllustration,
  HandoutIllustrations,
  IllustrationAspectRatio,
  IllustrationBubbleStyle,
  IllustrationConceptMode,
  IllustrationJob,
  IllustrationJobItem,
  IllustrationProfile,
  IllustrationQuality,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";
import {
  ILLUSTRATION_CREDIT_COST,
  IllustrationCreditError,
  getIllustrationCredits,
  refundIllustrationCredits,
  reserveIllustrationCredits,
} from "./illustration-credits";
import type { SceneAnalysis } from "./illustration-provider";
import {
  analyzePassageScene,
  getQualityModel,
  logIllustrationUsage,
  requestProviderImage,
} from "./illustration-provider";
import { getDb } from "./firebase-admin";
import { uploadIllustrationBase64 } from "./firebase-storage";
import { getHandout } from "./handouts";
const USER_COLLECTION = "users";
const JOB_COLLECTION = "illustration_jobs";
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
  aspectRatio: "4:3",
  updatedAt: new Date(0).toISOString(),
};
export { ILLUSTRATION_CREDIT_COST, IllustrationCreditError, getIllustrationCredits };
export class IllustrationJobNotFoundError extends Error {
  readonly code = "ILLUSTRATION_JOB_NOT_FOUND";
  constructor(jobId: string) {
    super(`Illustration job not found: ${jobId}`);
    this.name = "IllustrationJobNotFoundError";
  }
}
export class IllustrationPolicyBlockedError extends Error {
  readonly code = "ILLUSTRATION_POLICY_BLOCKED";
  readonly keyword: string;
  constructor(keyword: string) {
    super(`Illustration prompt is blocked by policy keyword: ${keyword}`);
    this.name = "IllustrationPolicyBlockedError";
    this.keyword = keyword;
  }
}
export class IllustrationJobConflictError extends Error {
  readonly code = "ILLUSTRATION_JOB_IN_PROGRESS";
  readonly jobId: string;
  constructor(jobId: string) {
    super(`Another illustration job is already running for this handout: ${jobId}`);
    this.name = "IllustrationJobConflictError";
    this.jobId = jobId;
  }
}
interface UserDocLike {
  illustrationProfile?: Partial<IllustrationProfile>;
}
interface CreateJobInput {
  handoutId: string;
  scope: "all" | "passages" | "stale";
  passageIds?: string[];
  quality?: IllustrationQuality;
  aspectRatio?: IllustrationAspectRatio;
  overwritePolicy?: "skip_completed" | "overwrite_all" | "stale_only";
  referenceImage?: IllustrationReferenceImage;
  conceptMode?: IllustrationConceptMode;
  conceptText?: string;
  includeKoreanText?: boolean;
  bubbleCount?: number;
  bubbleStyle?: IllustrationBubbleStyle;
  customBubbleTexts?: string[];
}
interface ListJobsOptions {
  handoutId?: string;
  activeOnly?: boolean;
  limit?: number;
}
function userDocRef(email: string) {
  return getDb().collection(USER_COLLECTION).doc(email.toLowerCase());
}
function jobDocRef(email: string, jobId: string) {
  return userDocRef(email).collection(JOB_COLLECTION).doc(jobId);
}
function nowIso(): string {
  return new Date().toISOString();
}
function toSafeText(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}
function hashSha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}
function findBlockedKeyword(text: string, keywords: string[]): string | null {
  const normalized = text.toLowerCase();
  for (const keyword of keywords) {
    const candidate = keyword.trim().toLowerCase();
    if (!candidate) continue;
    if (normalized.includes(candidate)) {
      return keyword;
    }
  }
  return null;
}
function getQualitySize(
  quality: IllustrationQuality,
  ratio: IllustrationAspectRatio
): { width: number; height: number } {
  const baseLong = quality === "draft" ? 768 : quality === "hq" ? 1536 : 1024;
  if (ratio === "1:1") return { width: baseLong, height: baseLong };
  if (ratio === "16:9") return { width: baseLong, height: Math.round((baseLong * 9) / 16) };
  return { width: baseLong, height: Math.round((baseLong * 3) / 4) };
}
function normalizeReferenceImage(
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
function normalizeProfile(
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
function profileHash(profile: IllustrationProfile): string {
  return hashSha256(
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
/** Strip Korean / CJK characters so the image-gen model won't render them. */
function stripNonLatinText(text: string): string {
  // Remove Korean (Hangul), CJK Unified Ideographs, and fullwidth forms
  return text
    .replace(/[　-鿿가-힯豈-﫿︰-﹏＀-￯]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildProfileStyleSection(profile: IllustrationProfile): string {
  const parts: string[] = [];

  if (profile.styleName) {
    parts.push(`Art style: ${profile.styleName}.`);
  }
  if (profile.palette) {
    parts.push(`Color palette: ${profile.palette}.`);
  }
  if (profile.lineStyle) {
    parts.push(`Line style: ${profile.lineStyle}.`);
  }

  if (parts.length === 0) {
    parts.push("Clean, appealing educational illustration style.");
  }

  return parts.join(" ");
}

function buildScenePrompt(
  passageId: string,
  rawText: string,
  profile: IllustrationProfile,
  referenceImage?: IllustrationReferenceImage,
  conceptMode?: IllustrationConceptMode,
  conceptText?: string
): string {
  const concise = stripNonLatinText(rawText.replace(/\s+/g, " ").trim()).slice(0, 1200);
  const banned = (profile.bannedKeywords ?? []).join(", ");
  const includeText = profile.includeKoreanText ?? false;

  // Concept enforcement lines based on mode
  const conceptLine = (() => {
    if (!conceptText || !conceptMode || conceptMode === "off") return "";
    if (conceptMode === "soft") {
      return `Visual concept reference (soft, treat as style inspiration): ${conceptText.slice(0, 200)}`;
    }
    return [
      `=== ABSOLUTE REQUIREMENT (HIGHEST PRIORITY) ===`,
      `ALL characters in this illustration MUST follow this concept: "${conceptText.slice(0, 200)}".`,
      `If the concept describes animals, draw ONLY anthropomorphic animals — NEVER humans.`,
      `If the concept describes robots, draw ONLY robots — NEVER humans.`,
      `The concept defines WHO appears in the scene. The passage text below defines WHAT they are doing.`,
      `Combine them: concept characters performing passage activities.`,
      `VIOLATION: Drawing characters that don't match the concept is a critical error.`,
      `=== END REQUIREMENT ===`,
    ].join(" ");
  })();

  const styleSection = buildProfileStyleSection(profile);

  const characterGuideLine =
    profile.characterGuide && !(conceptMode === "hard" && conceptText)
      ? `Character guide: ${profile.characterGuide}.`
      : "";

  const bubbleCount = profile.bubbleCount ?? 3;
  const bubbleStyleMap = { round: "round/oval speech bubbles", square: "rectangular/sharp-cornered speech bubbles", cloud: "cloud-shaped thought/speech bubbles" } as const;
  const bubbleStyleDesc = bubbleStyleMap[profile.bubbleStyle ?? "round"];
  const customTexts = profile.customBubbleTexts ?? [];
  const customTextLine = customTexts.length > 0
    ? `Use these EXACT Korean texts for the speech bubbles (in order): ${customTexts.map((t, i) => `${i + 1}. "${t}"`).join(", ")}.`
    : "Generate contextually appropriate Korean speech bubble texts based on the passage content.";

  const textInstructions = includeText
    ? [
        "**Structured Scene Layout:**",
        "1. **Title banner (top):** A prominent banner at the top with a Korean sentence summarizing the passage theme.",
        `2. **Character speech bubbles:** Draw exactly ${bubbleCount} ${bubbleStyleDesc} with Korean text. ${customTextLine}`,
        "3. **Keyword labels:** Arrows or annotation labels pointing to key concepts, written in Korean.",
        "4. **Summary caption (bottom):** A rectangular caption box at the bottom with a Korean wrap-up sentence.",
        "5. **Background:** Setting should match the passage context.",
        "All text MUST be in Korean (\ud55c\uad6d\uc5b4).",
      ].join("\n")
    : "Do NOT include any text, speech bubbles, labels, or letters inside the image. Express meaning through visuals only.";

  const moodLine = profile.mood
    ? `Mood: ${profile.mood}. Add small decorative elements relevant to the scene.`
    : "Mood: Warm, friendly, educational. Add small decorative elements (hearts, sparkles, icons).";

  const refLine = referenceImage
    ? conceptMode === "hard"
      ? "Reference style image is attached. The characters in this reference are the ONLY type of characters allowed. Copy their species/type exactly."
      : "Reference style image is attached. Preserve visual style but generate new scene content."
    : "";

  const negativePromptLine = (() => {
    const base = profile.negativePrompt ?? "";
    const hardSuffix = conceptMode === "hard" ? ", realistic human figures" : "";
    if (base) return `Negative prompt: ${base}${hardSuffix}`;
    if (hardSuffix) return `Negative prompt: realistic human figures`;
    return "";
  })();

  return [
    `Create a single-panel educational illustration for passage ${passageId}.`,
    "",
    `**Style:** ${styleSection}`,
    conceptLine,
    characterGuideLine,
    "",
    `**Scene:** Depict the main theme as a concrete scene: ${concise}`,
    "",
    textInstructions,
    "",
    moodLine,
    negativePromptLine,
    banned ? `Avoid keywords: ${banned}` : "",
    refLine,
    "No watermark. No photorealistic elements.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBackgroundKnowledge(rawText: string): string {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.slice(0, 240);
}
function shouldIncludePassage(
  passageId: string,
  rawText: string,
  existing: HandoutIllustrations | undefined,
  scope: CreateJobInput["scope"],
  scopePassageSet: Set<string> | null,
  overwritePolicy: "skip_completed" | "overwrite_all" | "stale_only"
): boolean {
  const current = existing?.[passageId];
  const sourceHash = hashSha256(rawText);
  const isCompleted = current?.status === "completed" && !!current?.imageUrl;
  const isStale = !!current && current.sourceHash !== sourceHash;
  if (scope === "passages" && scopePassageSet && !scopePassageSet.has(passageId)) {
    return false;
  }
  if (scope === "stale") {
    return isStale || !current || current.status === "failed";
  }
  if (overwritePolicy === "overwrite_all") return true;
  if (overwritePolicy === "stale_only") return isStale || !current;
  if (overwritePolicy === "skip_completed") return !isCompleted;
  return true;
}
function normalizeJob(input: Partial<IllustrationJob>): IllustrationJob {
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
    aspectRatio: input.aspectRatio || "4:3",
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
export async function getIllustrationProfile(
  email: string
): Promise<IllustrationProfile> {
  const snap = await userDocRef(email).get();
  const data = (snap.data() ?? {}) as UserDocLike;
  return normalizeProfile(data.illustrationProfile);
}
export async function updateIllustrationProfile(
  email: string,
  patch: Omit<Partial<IllustrationProfile>, "referenceImage"> & {
    referenceImage?: Partial<IllustrationReferenceImage> | null;
  }
): Promise<IllustrationProfile> {
  const shouldClearReferenceImage = patch.referenceImage === null;
  const current = await getIllustrationProfile(email);
  const next = normalizeProfile({
    ...current,
    ...patch,
    updatedAt: nowIso(),
  });
  await userDocRef(email).set(
    {
      illustrationProfile: next,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  if (shouldClearReferenceImage) {
    await userDocRef(email).set(
      {
        illustrationProfile: {
          referenceImage: FieldValue.delete(),
        },
      },
      { merge: true }
    );
    return {
      ...next,
      referenceImage: undefined,
    };
  }
  return next;
}
export async function listIllustrationJobs(
  email: string,
  options: ListJobsOptions = {}
): Promise<IllustrationJob[]> {
  const limit = Math.max(1, Math.min(50, options.limit ?? 20));
  let query: FirebaseFirestore.Query = userDocRef(email)
    .collection(JOB_COLLECTION)
    .limit(limit);
  if (options.handoutId) {
    query = query.where("handoutId", "==", options.handoutId);
  }
  const snap = await query.get();
  const rows = snap.docs
    .map((doc) => normalizeJob(doc.data() as Partial<IllustrationJob>))
    .filter((job) => (options.activeOnly ? job.status === "queued" || job.status === "running" : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return rows.slice(0, limit);
}
export async function createIllustrationJob(
  email: string,
  input: CreateJobInput
): Promise<IllustrationJob> {
  const handout = await getHandout(input.handoutId, email);
  if (!handout) {
    throw new Error("Handout not found.");
  }
  const profile = await getIllustrationProfile(email);
  const quality = input.quality ?? profile.defaultQuality;
  const aspectRatio = input.aspectRatio ?? profile.aspectRatio;
  const referenceImage =
    normalizeReferenceImage(input.referenceImage) ?? profile.referenceImage;
  const overwritePolicy = input.overwritePolicy ?? "skip_completed";
  const scopeSet =
    input.scope === "passages" && Array.isArray(input.passageIds)
      ? new Set(input.passageIds)
      : null;
  const selectedPassageIds = Object.keys(handout.sections)
    .sort()
    .filter((passageId) =>
      shouldIncludePassage(
        passageId,
        handout.sections[passageId] ?? "",
        handout.illustrations,
        input.scope,
        scopeSet,
        overwritePolicy
      )
    );
  if (selectedPassageIds.length === 0) {
    throw new Error("No eligible passages found for illustration generation.");
  }
  const unitCost = ILLUSTRATION_CREDIT_COST[quality];
  const reservedCredits = selectedPassageIds.length * unitCost;
  const now = nowIso();
  const pHash = profileHash(profile);
  const conceptMode = input.conceptMode ?? "off";
  const conceptText = conceptMode !== "off" && input.conceptText ? input.conceptText.trim().slice(0, 300) : undefined;
  const items: Record<string, IllustrationJobItem> = {};
  const bannedKeywords = profile.bannedKeywords ?? [];
  for (const passageId of selectedPassageIds) {
    const rawText = handout.sections[passageId] ?? "";
    const blockedKeyword = findBlockedKeyword(rawText, bannedKeywords);
    if (blockedKeyword) {
      throw new IllustrationPolicyBlockedError(blockedKeyword);
    }
    items[passageId] = {
      passageId,
      status: "queued",
      attempts: 0,
      prompt: buildScenePrompt(passageId, rawText, profile, referenceImage, conceptMode, conceptText),
      sourceHash: hashSha256(rawText),
      referenceImage,
    };
  }
  const ref = userDocRef(email).collection(JOB_COLLECTION).doc();
  const job: IllustrationJob = {
    id: ref.id,
    handoutId: input.handoutId,
    referenceImage,
    status: "queued",
    quality,
    aspectRatio,
    total: selectedPassageIds.length,
    completed: 0,
    failed: 0,
    reservedCredits,
    consumedCredits: 0,
    refundedCredits: 0,
    overwritePolicy,
    conceptMode: conceptMode !== "off" ? conceptMode : undefined,
    conceptText,
    includeKoreanText: input.includeKoreanText ?? false,
    bubbleCount: input.bubbleCount,
    bubbleStyle: input.bubbleStyle,
    customBubbleTexts: input.customBubbleTexts,
    items,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().runTransaction(async (tx) => {
    const activeJobsSnap = await tx.get(
      userDocRef(email).collection(JOB_COLLECTION).where("handoutId", "==", input.handoutId).limit(20)
    );
    const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
    const staleJobIds: string[] = [];
    const conflicted = activeJobsSnap.docs.find((doc) => {
      const data = doc.data() as { status?: string; updatedAt?: string };
      const status = String(data.status ?? "");
      if (status !== "queued" && status !== "running") return false;
      // Auto-expire stale jobs older than 30 minutes
      const updatedAt = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;
      if (Date.now() - updatedAt > STALE_THRESHOLD_MS) {
        staleJobIds.push(doc.id);
        return false;
      }
      return true;
    });
    // Mark stale jobs as failed within the same transaction
    for (const staleId of staleJobIds) {
      tx.update(userDocRef(email).collection(JOB_COLLECTION).doc(staleId), {
        status: "failed",
        updatedAt: now,
      });
    }
    if (conflicted) {
      throw new IllustrationJobConflictError(conflicted.id);
    }
    await reserveIllustrationCredits(tx, email, reservedCredits);
    tx.set(ref, {
      ...job,
      profileHash: pHash,
      profileSnapshot: profile,
      sourcePassageIds: selectedPassageIds,
    });
  });
  return job;
}
export async function getIllustrationJob(
  email: string,
  jobId: string
): Promise<IllustrationJob> {
  const snap = jobDocRef(email, jobId).get();
  const doc = await snap;
  if (!doc.exists) {
    throw new IllustrationJobNotFoundError(jobId);
  }
  return normalizeJob(doc.data() as Partial<IllustrationJob>);
}
export async function runIllustrationJob(
  email: string,
  jobId: string,
  batchSize = 3
): Promise<IllustrationJob> {
  const ref = jobDocRef(email, jobId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new IllustrationJobNotFoundError(jobId);
  }
  const job = normalizeJob(snap.data() as Partial<IllustrationJob>);
  if (job.status === "completed" || job.status === "canceled") {
    return job;
  }
  const handout = await getHandout(job.handoutId, email);
  if (!handout) {
    throw new Error("Target handout was deleted.");
  }
  const rawProfile = await getIllustrationProfile(email);
  const profile: IllustrationProfile = {
    ...rawProfile,
    includeKoreanText: job.includeKoreanText ?? rawProfile.includeKoreanText ?? false,
    bubbleCount: job.bubbleCount,
    bubbleStyle: job.bubbleStyle,
    customBubbleTexts: job.customBubbleTexts,
  };
  const unitCost = ILLUSTRATION_CREDIT_COST[job.quality];
  const items = { ...job.items };
  let consumedCredits = job.consumedCredits;
  const queue = Object.values(items)
    .filter((item) => item.status === "queued")
    .slice(0, Math.max(1, Math.min(10, batchSize)));
  if (queue.length === 0) {
    return finalizeIllustrationJob(email, ref, job);
  }
  await ref.set(
    {
      status: "running",
      updatedAt: nowIso(),
    },
    { merge: true }
  );
  const illustrationsPatch: Record<string, Record<string, unknown>> = {};
  for (const queued of queue) {
    const startedAtMs = Date.now();
    const rawText = handout.sections[queued.passageId] ?? "";
    const effectiveReferenceImage =
      queued.referenceImage ?? job.referenceImage ?? profile.referenceImage;
    const prompt = buildScenePrompt(
      queued.passageId,
      rawText,
      profile,
      effectiveReferenceImage
    );

    // Stage 1: Analyze passage with text model for structured scene description
    let sceneAnalysis: SceneAnalysis | undefined;
    try {
      sceneAnalysis = await analyzePassageScene(
        rawText,
        profile,
        job.conceptMode,
        job.conceptText
      );
    } catch (analysisError) {
      const analysisMessage =
        analysisError instanceof Error ? analysisError.message : String(analysisError);
      console.warn(
        `[illustrations] Scene analysis failed for ${queued.passageId}, proceeding without: ${analysisMessage}`
      );
    }

    const blockedKeyword = findBlockedKeyword(rawText, profile.bannedKeywords ?? []);
    if (blockedKeyword) {
      items[queued.passageId] = {
        ...queued,
        status: "failed",
        attempts: Math.max(0, queued.attempts) + 1,
        errorMessage: `ILLUSTRATION_POLICY_BLOCKED:${blockedKeyword}`,
        finishedAt: nowIso(),
      };
      await logIllustrationUsage({
        email,
        jobId,
        handoutId: job.handoutId,
        passageId: queued.passageId,
        quality: job.quality,
        model: getQualityModel(job.quality),
        status: "failed",
        latencyMs: Date.now() - startedAtMs,
        errorCode: "ILLUSTRATION_POLICY_BLOCKED",
      });
      continue;
    }
    const analysisDebugInfo = sceneAnalysis
      ? `

[Scene Analysis]
${JSON.stringify(sceneAnalysis, null, 2)}`
      : "";
    const current: IllustrationJobItem = {
      ...queued,
      prompt: prompt + analysisDebugInfo,
      attempts: Math.max(0, queued.attempts) + 1,
      status: "running",
      startedAt: nowIso(),
      errorMessage: undefined,
    };
    items[queued.passageId] = current;
    try {
      const generated = await requestProviderImage({
        scene: prompt,
        profile,
        quality: job.quality,
        aspectRatio: job.aspectRatio,
        referenceImage: effectiveReferenceImage,
        sceneAnalysis,
      });
      const uploaded = await uploadIllustrationBase64({
        email,
        handoutId: job.handoutId,
        passageId: queued.passageId,
        base64Data: generated.imageBase64,
        contentType: generated.mimeType,
      });
      const size = getQualitySize(job.quality, job.aspectRatio);
      const updatedAt = nowIso();
      const illustration: HandoutIllustration = {
        status: "completed",
        imageUrl: uploaded.imageUrl,
        storagePath: uploaded.storagePath,
        referenceImage: effectiveReferenceImage,
        prompt: generated.revisedPrompt || prompt,
        negativePrompt: profile.negativePrompt,
        model: generated.model || getQualityModel(job.quality),
        quality: job.quality,
        aspectRatio: job.aspectRatio,
        seed: generated.seed,
        width: size.width,
        height: size.height,
        sourceHash: hashSha256(rawText),
        profileHash: profileHash(profile),
        updatedAt,
      };
      illustrationsPatch[queued.passageId] = {
        ...illustration,
        backgroundKnowledge: buildBackgroundKnowledge(rawText),
      };
      items[queued.passageId] = {
        ...current,
        status: "completed",
        imageUrl: uploaded.imageUrl,
        storagePath: uploaded.storagePath,
        finishedAt: updatedAt,
      };
      const updatedConsumedCredits = consumedCredits + unitCost;
      consumedCredits = updatedConsumedCredits;
      await logIllustrationUsage({
        email,
        jobId,
        handoutId: job.handoutId,
        passageId: queued.passageId,
        quality: job.quality,
        model: generated.model || getQualityModel(job.quality),
        status: "completed",
        latencyMs: Date.now() - startedAtMs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      items[queued.passageId] = {
        ...current,
        status: "failed",
        errorMessage: message.slice(0, 400),
        finishedAt: nowIso(),
      };
      const errorCode = message.includes("ILLUSTRATION_POLICY_BLOCKED")
        ? "ILLUSTRATION_POLICY_BLOCKED"
        : "ILLUSTRATION_PROVIDER_ERROR";
      await logIllustrationUsage({
        email,
        jobId,
        handoutId: job.handoutId,
        passageId: queued.passageId,
        quality: job.quality,
        model: getQualityModel(job.quality),
        status: "failed",
        latencyMs: Date.now() - startedAtMs,
        errorCode,
      });
    }
  }
  // Batch write all completed illustrations to handout document in one call
  if (Object.keys(illustrationsPatch).length > 0) {
    await userDocRef(email)
      .collection("handouts")
      .doc(job.handoutId)
      .set(
        {
          illustrations: illustrationsPatch,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }
  const nextJob: IllustrationJob = {
    ...job,
    items,
    consumedCredits,
  };
  return finalizeIllustrationJob(email, ref, nextJob);
}
async function finalizeIllustrationJob(
  email: string,
  ref: FirebaseFirestore.DocumentReference,
  currentJob: IllustrationJob
): Promise<IllustrationJob> {
  const items = currentJob.items;
  const completed = Object.values(items).filter((item) => item.status === "completed").length;
  const failed = Object.values(items).filter((item) => item.status === "failed").length;
  const queuedOrRunning = Object.values(items).filter(
    (item) => item.status === "queued" || item.status === "running"
  ).length;
  let nextStatus: IllustrationJob["status"] = "running";
  if (queuedOrRunning === 0 && failed === 0) nextStatus = "completed";
  if (queuedOrRunning === 0 && failed > 0) nextStatus = "partial_failed";
  const next: IllustrationJob = {
    ...currentJob,
    status: nextStatus,
    completed,
    failed,
    updatedAt: nowIso(),
  };
  if (nextStatus === "partial_failed") {
    const refundable = Math.max(
      0,
      next.reservedCredits - next.consumedCredits - next.refundedCredits
    );
    if (refundable > 0) {
      await getDb().runTransaction(async (tx) => {
        await refundIllustrationCredits(tx, email, refundable, `illu_refund_${next.id}`);
        tx.set(
          ref,
          {
            refundedCredits: next.refundedCredits + refundable,
            failedRefundedAt: nowIso(),
            updatedAt: nowIso(),
          },
          { merge: true }
        );
      });
      next.refundedCredits += refundable;
      next.failedRefundedAt = nowIso();
    }
  }
  await ref.set(
    {
      status: next.status,
      completed: next.completed,
      failed: next.failed,
      consumedCredits: next.consumedCredits,
      refundedCredits: next.refundedCredits,
      failedRefundedAt: next.failedRefundedAt ?? null,
      items: next.items,
      updatedAt: next.updatedAt,
    },
    { merge: true }
  );
  return next;
}
export async function retryIllustrationJob(
  email: string,
  jobId: string
): Promise<IllustrationJob> {
  const ref = jobDocRef(email, jobId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new IllustrationJobNotFoundError(jobId);
  }
  const job = normalizeJob(snap.data() as Partial<IllustrationJob>);
  const failedItems = Object.values(job.items).filter((item) => item.status === "failed");
  if (failedItems.length === 0) {
    return job;
  }
  const reserveAmount = failedItems.length * ILLUSTRATION_CREDIT_COST[job.quality];
  const updatedItems = { ...job.items };
  const now = nowIso();
  for (const item of failedItems) {
    updatedItems[item.passageId] = {
      ...item,
      status: "queued",
      errorMessage: undefined,
      startedAt: undefined,
      finishedAt: undefined,
    };
  }
  await getDb().runTransaction(async (tx) => {
    await reserveIllustrationCredits(tx, email, reserveAmount);
    tx.set(
      ref,
      {
        status: "queued",
        items: updatedItems,
        reservedCredits: job.reservedCredits + reserveAmount,
        updatedAt: now,
      },
      { merge: true }
    );
  });
  return {
    ...job,
    status: "queued",
    items: updatedItems,
    reservedCredits: job.reservedCredits + reserveAmount,
    updatedAt: now,
  };
}
export async function cancelIllustrationJob(
  email: string,
  jobId: string
): Promise<IllustrationJob> {
  const ref = jobDocRef(email, jobId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new IllustrationJobNotFoundError(jobId);
  }
  const job = normalizeJob(snap.data() as Partial<IllustrationJob>);
  if (job.status === "canceled" || job.status === "completed") {
    return job;
  }
  const refundable = Math.max(
    0,
    job.reservedCredits - job.consumedCredits - job.refundedCredits
  );
  const now = nowIso();
  await getDb().runTransaction(async (tx) => {
    if (refundable > 0) {
      await refundIllustrationCredits(tx, email, refundable, `illu_cancel_${job.id}`);
    }
    tx.set(
      ref,
      {
        status: "canceled",
        refundedCredits: job.refundedCredits + refundable,
        updatedAt: now,
      },
      { merge: true }
    );
  });
  return {
    ...job,
    status: "canceled",
    refundedCredits: job.refundedCredits + refundable,
    updatedAt: now,
  };
}
export async function generateIllustrationSample(
  email: string,
  input: {
    scene: string;
    quality?: IllustrationQuality;
    aspectRatio?: IllustrationAspectRatio;
    referenceImage?: IllustrationReferenceImage;
  }
): Promise<{ imageUrl: string; storagePath: string; model: string; prompt: string }> {
  const profile = await getIllustrationProfile(email);
  const quality = input.quality ?? profile.defaultQuality;
  const aspectRatio = input.aspectRatio ?? profile.aspectRatio;
  const referenceImage =
    normalizeReferenceImage(input.referenceImage) ?? profile.referenceImage;
  const scene = input.scene.trim();
  if (!scene) {
    throw new Error("Scene prompt is required.");
  }
  const blockedKeyword = findBlockedKeyword(scene, profile.bannedKeywords ?? []);
  if (blockedKeyword) {
    throw new IllustrationPolicyBlockedError(blockedKeyword);
  }
  const prompt = [
    "Create a sample classroom illustration.",
    `Scene: ${scene.slice(0, 1200)}`,
    `Style: ${profile.styleName}`,
    `Character guide: ${profile.characterGuide}`,
    `Palette: ${profile.palette}`,
    `Line style: ${profile.lineStyle}`,
    `Mood: ${profile.mood}`,
    referenceImage
      ? "Reference style image is attached. Follow its visual style while drawing a new scene."
      : "",
    profile.negativePrompt ? `Negative prompt: ${profile.negativePrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const generated = await requestProviderImage({
    scene,
    profile,
    quality,
    aspectRatio,
    referenceImage,
  });
  const sampleId = `sample_${Date.now()}`;
  const uploaded = await uploadIllustrationBase64({
    email,
    handoutId: "_samples",
    passageId: sampleId,
    base64Data: generated.imageBase64,
    contentType: generated.mimeType,
  });
  return {
    imageUrl: uploaded.imageUrl,
    storagePath: uploaded.storagePath,
    model: generated.model || getQualityModel(quality),
    prompt: generated.revisedPrompt || prompt,
  };
}
