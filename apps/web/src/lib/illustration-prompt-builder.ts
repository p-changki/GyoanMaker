import type {
  HandoutIllustrations,
  IllustrationConceptMode,
  IllustrationProfile,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";

type CreateJobScope = "all" | "passages" | "stale";
type OverwritePolicy = "skip_completed" | "overwrite_all" | "stale_only";

/** Strip Korean / CJK characters so the image-gen model won't render them. */
export function stripNonLatinText(text: string): string {
  // Remove Korean (Hangul), CJK Unified Ideographs, and fullwidth forms
  return text
    .replace(/[　-鿿가-힯豈-﫿︰-﹏＀-￯]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function buildProfileStyleSection(profile: IllustrationProfile): string {
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

export function buildScenePrompt(
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
  const bubbleStyleMap = {
    round: "round/oval speech bubbles",
    square: "rectangular/sharp-cornered speech bubbles",
    cloud: "cloud-shaped thought/speech bubbles",
  } as const;
  const bubbleStyleDesc = bubbleStyleMap[profile.bubbleStyle ?? "round"];
  const customTexts = profile.customBubbleTexts ?? [];
  const customTextLine =
    customTexts.length > 0
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

export function buildBackgroundKnowledge(rawText: string): string {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.slice(0, 240);
}

export function shouldIncludePassage(
  passageId: string,
  rawText: string,
  existing: HandoutIllustrations | undefined,
  scope: CreateJobScope,
  scopePassageSet: Set<string> | null,
  overwritePolicy: OverwritePolicy,
  hashSha256Fn: (value: string) => string
): boolean {
  const current = existing?.[passageId];
  const sourceHash = hashSha256Fn(rawText);
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
