/** 시험지 헤더 설정 */
export interface TestConfig {
  testCode: string; // "VT1" (자동 채번 또는 사용자 입력)
  rangeDescription: string; // "24년 10월 20-30번 유의어" (사용자 자유 입력)
  schoolName: string; // "대전어고2" (사용자 입력)
  testTitle: string; // "VOCA TEST" (기본값, 수정 가능)
  teacherName: string; // "서하늘 영어" (사용자 입력)
  cutline: string; // "-3" (사용자 입력, 선택사항)
}

/** 5지선다 보기 항목 */
export interface TestOption {
  number: number; // 1~5 (①~⑤에 매핑)
  word: string; // 영어 단어만
  isCorrect: boolean; // synonym이면 true
}

/** 단일 문제 */
export interface VocaTestQuestion {
  id: string; // `${passageId}_${vocabIndex}`
  keyword: string; // 제시 키워드 (영어만)
  options: TestOption[]; // 5개 고정
  correctNumbers: number[]; // 정답 번호 배열 [2, 5] (답안지용)
  sourcePassageId: string; // 원본 지문 ID
}

/** 문제 풀 (교안 1개 기준) */
export interface QuestionPool {
  handoutId: string;
  handoutTitle: string;
  questions: VocaTestQuestion[]; // 최대 80개
}
