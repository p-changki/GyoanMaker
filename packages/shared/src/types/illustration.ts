export type IllustrationStatus =
  | "idle"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "stale";

export type IllustrationQuality = "draft" | "standard" | "hq";
export type IllustrationAspectRatio = "4:3" | "1:1" | "16:9";
export type IllustrationConceptMode = "off" | "soft" | "hard";
export type IllustrationBubbleStyle = "round" | "square" | "cloud";

export interface IllustrationReferenceImage {
  imageUrl: string;
  storagePath: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  width?: number;
  height?: number;
  source: "upload" | "sample";
  updatedAt: string;
}

export interface IllustrationProfile {
  profileId: "default";
  styleEnabled: boolean;
  styleName: string;
  characterGuide: string;
  palette: string;
  lineStyle: string;
  mood: string;
  negativePrompt?: string;
  bannedKeywords?: string[];
  referenceImage?: IllustrationReferenceImage;
  defaultQuality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  includeKoreanText?: boolean;
  bubbleCount?: number;
  bubbleStyle?: IllustrationBubbleStyle;
  customBubbleTexts?: string[];
  updatedAt: string;
}

export interface HandoutIllustration {
  status: IllustrationStatus;
  imageUrl?: string;
  storagePath?: string;
  referenceImage?: IllustrationReferenceImage;
  prompt: string;
  caption?: string;
  backgroundKnowledge?: string;
  negativePrompt?: string;
  model: string;
  quality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  seed?: number;
  width: number;
  height: number;
  sourceHash: string;
  profileHash: string;
  errorMessage?: string;
  updatedAt: string;
}

export type HandoutIllustrations = Record<string, HandoutIllustration>;

export type IllustrationJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial_failed"
  | "failed"
  | "canceled";

export interface IllustrationJobItem {
  passageId: string;
  status: "queued" | "running" | "completed" | "failed";
  attempts: number;
  prompt: string;
  sourceHash: string;
  referenceImage?: IllustrationReferenceImage;
  imageUrl?: string;
  storagePath?: string;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface IllustrationJob {
  id: string;
  handoutId: string;
  referenceImage?: IllustrationReferenceImage;
  status: IllustrationJobStatus;
  quality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  total: number;
  completed: number;
  failed: number;
  reservedCredits: number;
  consumedCredits: number;
  refundedCredits: number;
  failedRefundedAt?: string;
  overwritePolicy: "skip_completed" | "overwrite_all" | "stale_only";
  conceptMode?: IllustrationConceptMode;
  conceptText?: string;
  includeKoreanText?: boolean;
  bubbleCount?: number;
  bubbleStyle?: IllustrationBubbleStyle;
  customBubbleTexts?: string[];
  items: Record<string, IllustrationJobItem>;
  createdAt: string;
  updatedAt: string;
}

export interface IllustrationStylePreset {
  presetId: string;
  name: string;
  styleName: string;
  palette: string;
  lineStyle: string;
  mood: string;
  characterGuide: string;
  negativePrompt: string;
  defaultQuality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  createdAt: string;
}
