import type { PaymentMethod, PlanId, PlanStatus } from "../plans";
import type { SentencePair, TopicSentence } from "./handout";

export type {
  PlanDefinition,
  PlanId,
  PlanStatus,
  PaymentMethod,
  QuotaModel,
  TopUpPackageDefinition,
  TopUpPackageId,
} from "../plans";
export type * from "./handout";
export type * from "./templateSettings";
export {
  DEFAULT_TEMPLATE_SETTINGS,
  DEFAULT_PAGE1_LAYOUT,
  DEFAULT_SECTION_STYLE,
  VALID_PAGE2_SECTIONS,
  PAGE2_SECTION_LABELS,
  THEME_PRESETS,
  VALID_THEME_PRESETS,
  VALID_FONT_SCALES,
  VALID_FONT_FAMILIES,
  VALID_TITLE_WEIGHTS,
  FONT_SCALE_MAP,
  FONT_FAMILY_MAP,
  TITLE_WEIGHT_MAP,
  FONT_SIZE_PRESETS,
  FONT_SIZE_SLOT_META,
  FONT_SIZE_GROUPS,
  SECTION_FONT_SIZE_KEYS,
  EDITABLE_SECTION_LABELS,
  isBuiltInSectionKey,
  isCustomSectionKey,
  getSectionFontSizeKeys,
  MAX_CUSTOM_SECTIONS,
  CUSTOM_SECTION_FONT_SIZE_KEYS,
  DEFAULT_IMAGE_DISPLAY,
} from "./templateSettings";

export type ResultStatus = "generating" | "completed" | "failed";

export type PassageId = string;

export interface Flow4Item {
  label: string;
  text: string;
}

export type VocabLevel = "B2" | "C1";

export interface VocabRelated {
  word: string;
  meaning_ko: string;
  level: VocabLevel;
}

export interface CoreVocabItem {
  word: string;
  meaning_ko: string;
  synonyms: VocabRelated[];
  antonyms: VocabRelated[];
}

export interface PassageResult {
  passage_id: string;
  sentences: SentencePair[];
  topic_sentence: TopicSentence;
  summary: {
    en: string[];
    ko: string[];
  };
  flow_4: Flow4Item[];
  core_vocab: CoreVocabItem[];
}

export type InputMode = "text" | "cards";

/** @deprecated Use ContentLevel + ModelTier instead */
export type GenerationMode = "basic" | "flash";

export type ContentLevel = "advanced" | "basic";
export type ModelTier = "pro" | "flash";

export interface OutputOptionState {
  copyBlock: boolean;
  pdf: boolean;
}

export interface PassageInput {
  id: string;
  text: string;
}

export interface UserPlan {
  tier: PlanId;
  status: PlanStatus;
  currentPeriodStartAt: string;
  currentPeriodEndAt: string | null;
  paymentMethod: PaymentMethod | null;
}

export interface ModelQuota {
  monthlyLimit: number;
  used: number;
  monthKeyKst: string;
}

export interface CreditEntry {
  remaining: number;
  purchasedAt: string;
  expiresAt: string;
  orderId?: string;
}

export interface UserQuota {
  flash: ModelQuota;
  pro: ModelQuota;
  storageLimit: number | null;
  storageUsed: number;
}

export interface UserCredits {
  flash: CreditEntry[];
  pro: CreditEntry[];
}
