/** STEP 2: 어법/어휘 선택 — 빈칸 1개의 정오답 쌍 */
export interface WorkbookChoice {
  correct: string; // 정답 표현 (원문 그대로)
  wrong: string; // 오답 표현 (문법적으로 그럴듯한 오류)
}

/** STEP 2: 문장 1개의 문법/어휘 문제 */
export interface WorkbookStep2Item {
  sentenceIndex: number; // 원본 sentences[] 인덱스 (0-based)
  questionNumber: number; // 문제 번호 (1-based, 누적)
  sentenceTemplate: string; // "[Start / To start] off the new school year..."
  choices: WorkbookChoice[]; // 빈칸별 정오답 (1~3개)
  answerKey: string[]; // choices.map((c) => c.correct)
}

/** STEP 3 품질 검수 경고 */
export interface WorkbookWarning {
  code: string; // e.g. "DUPLICATE_SEGMENT", "SHORT_SEGMENT", "LOW_COVERAGE", "UNBALANCED_LENGTH", "FALLBACK_PARAGRAPH_TEXT"
  message: string; // human-readable description
  severity: "warning" | "error";
}

/** STEP 3: 단락 배열 순서 문제 */
export interface WorkbookStep3Item {
  questionNumber: number; // 문제 번호 (1-based)
  passageNumber: number; // 상첨자 지문 번호
  type: "3p" | "4p"; // 3단락 or 4단락
  intro: string; // 도입 단락 (고정 제시)
  paragraphs: {
    label: string; // "A" | "B" | "C" | "D"
    text: string;
  }[];
  options: string[][]; // 5개 순서 배열
  answerIndex: number; // 정답 선택지 인덱스 (0-based, 0~4)
  warnings?: WorkbookWarning[]; // backend validation warnings (optional)
}

/** 지문 1개의 워크북 데이터 */
export interface PassageWorkbook {
  passageId: string; // "P01", "P02", ...
  passageTitle: string; // 표시용
  step2Items: WorkbookStep2Item[]; // 해당 지문의 STEP 2 문항들
  step3Items: WorkbookStep3Item[]; // 해당 지문의 STEP 3 문항들
}

/** 전체 워크북 */
export interface WorkbookData {
  passages: PassageWorkbook[];
  model: "flash" | "pro";
  generatedAt: string; // ISO 8601
}

/** 워크북 시험지 헤더 설정 (UI에서 사용자 입력) */
export interface WorkbookConfig {
  testCode: string; // "02" (좌상단 큰 숫자)
  testTitle: string; // "Upgrade" (제목)
  rangeDescription: string; // "공통영어1 비상(홍) 1과" (우상단 뱃지)
  teacherName: string; // "하늘쌤이 항상 응원해♥" (하단 텍스트)
}
