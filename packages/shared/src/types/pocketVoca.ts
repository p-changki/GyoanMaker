export interface PocketVocaSynAnt {
  word: string;
  meaningKo: string;
}

export interface PocketVocaWord {
  word: string;
  partOfSpeech: string; // "n." | "v." | "adj." | "adv."
  meaningKo: string;
  synonyms: PocketVocaSynAnt[]; // 5개
  antonyms: PocketVocaSynAnt[]; // 5개
}

export interface PocketVocaPassage {
  passageId: string;
  passageLabel: string; // 사용자 편집 가능 라벨 (예: "15강 4번")
  items: PocketVocaWord[]; // 7~10개
}

export interface PocketVocaData {
  passages: PocketVocaPassage[];
  model: "flash" | "pro";
  generatedAt: string;
  handoutId: string;
  handoutTitle: string;
}

export interface PocketVocaConfig {
  sheetCode: string;
  sheetTitle: string;
  sectionLabel: string;
  rangeDescription: string;
  teacherName: string;
}

export interface SavedPocketVoca {
  id: string;
  ownerEmail: string;
  title: string;
  passageCount: number;
  model: "flash" | "pro";
  data: PocketVocaData;
  config: PocketVocaConfig;
  handoutId: string;
  handoutTitle: string;
  createdAt: string;
  updatedAt: string;
}
