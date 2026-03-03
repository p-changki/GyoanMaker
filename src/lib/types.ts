export type ResultStatus = "generating" | "completed" | "failed";

export type PassageId = string;

// NOTE: 아래 타입들은 API 응답 스키마용 레거시 타입입니다.
// 교안 파싱/렌더링에는 src/types/handout.ts 의 타입을 사용하세요.
export interface SentencePair {
  en: string;
  ko: string;
}

export interface TopicSentence {
  en: string;
  ko: string;
}

/** @deprecated 교안 파싱에는 src/types/handout.ts의 Summary를 사용하세요 */
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

export type GenerationMode = "basic" | "advanced";

export interface OutputOptionState {
  copyBlock: boolean;
  pdf: boolean;
}

export interface PassageInput {
  id: string;
  text: string;
}

// NextAuth v5 타입 확장: Session User/JWT에 approved, userStatus 필드 추가
declare module "@auth/core/types" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      approved: boolean;
      userStatus: "pending" | "approved" | "rejected";
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    approved?: boolean;
    userStatus?: "pending" | "approved" | "rejected";
  }
}
