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
