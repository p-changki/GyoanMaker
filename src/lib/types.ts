export type ResultStatus = "generating" | "completed" | "failed";

export type PassageId = string;

export interface SentencePair {
  en: string;
  ko: string;
}

export interface TopicSentence {
  en: string;
  ko: string;
}

export interface Summary {
  en: string[];
  ko: string[];
}

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
  summary: Summary;
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
