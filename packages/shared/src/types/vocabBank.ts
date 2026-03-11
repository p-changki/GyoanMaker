export interface VocabBankItem {
  word: string;
  partOfSpeech: string;
  meaningKo: string;
  sourcePassageIds: string[];
}

export interface VocabBankData {
  items: VocabBankItem[];
  model: "flash" | "pro";
  generatedAt: string;
}

export interface VocabBankConfig {
  sheetCode: string;
  sheetTitle: string;
  rangeDescription: string;
  teacherName: string;
}
