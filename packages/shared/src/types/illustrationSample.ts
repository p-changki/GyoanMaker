import type { IllustrationAspectRatio, IllustrationQuality } from "./illustration";

export interface IllustrationSample {
  sampleId: string;
  prompt: string;
  revisedPrompt: string;
  imageUrl: string;
  storagePath: string;
  model: string;
  quality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
  isActive: boolean;
  isPreset?: boolean;
  createdAt: string;
}
