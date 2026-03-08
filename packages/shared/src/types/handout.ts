import type { HandoutIllustrations } from "./illustration";

export interface SentencePair {
  en: string;
  ko: string;
}

export interface TopicSentence {
  en: string;
  ko: string;
}

export interface Summary {
  en: string;
  ko: string;
}

export interface FlowItem {
  index: number;
  text: string;
}

export interface VocabRelated {
  word: string;
  meaning: string;
}

export interface VocabItem {
  index: number;
  word: string;
  meaning: string;
  synonyms: VocabRelated[];
  antonyms: VocabRelated[];
}

export interface HandoutSection {
  passageId: string;
  sentences: SentencePair[];
  topic: TopicSentence;
  summary: Summary;
  flow: FlowItem[];
  vocabulary: VocabItem[];
  rawText: string; // 파싱 실패 시 원본 표시용
  isParsed: boolean;
}

export interface CompiledHandout {
  sections: Record<string, HandoutSection>;
  illustrations?: HandoutIllustrations;
  lastUpdated: string;
}
