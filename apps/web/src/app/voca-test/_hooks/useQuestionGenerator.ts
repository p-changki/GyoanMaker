import type { VocabItem, VocabRelated } from "@gyoanmaker/shared/types/handout";
import type { TestOption, VocaTestQuestion } from "./vocaTest.types";

interface CandidateOption {
  word: string;
  isCorrect: boolean;
}

/** Total number of choices per question */
const OPTION_COUNT = 5;
/** Number of correct answers (synonyms) */
const CORRECT_COUNT = 2;

function wordKey(word: string): string {
  return word.trim().toLowerCase();
}

function uniqueRelated(entries: VocabRelated[]): VocabRelated[] {
  const seen = new Set<string>();
  const result: VocabRelated[] = [];

  for (const entry of entries) {
    const key = wordKey(entry.word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }

  return result;
}

export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function hasRepeatedCorrectPattern(
  questions: VocaTestQuestion[],
  correctNumbers: number[]
): boolean {
  const target = correctNumbers.join("-");
  return questions.slice(-3).some((q) => q.correctNumbers.join("-") === target);
}

/**
 * Checks position bias at two levels:
 * 1. Global: no position should exceed 25% of all correct slots (ideal 20%)
 * 2. Local window: no position should exceed 40% in the last 5 questions
 */
function hasPositionBias(
  questions: VocaTestQuestion[],
  correctNumbers: number[]
): boolean {
  // --- Global cumulative check (kicks in after 4 questions) ---
  if (questions.length >= 4) {
    const globalCounts = new Map<number, number>();
    for (const q of questions) {
      for (const n of q.correctNumbers) {
        globalCounts.set(n, (globalCounts.get(n) ?? 0) + 1);
      }
    }
    for (const n of correctNumbers) {
      globalCounts.set(n, (globalCounts.get(n) ?? 0) + 1);
    }
    const totalSlots = (questions.length + 1) * CORRECT_COUNT;
    const globalMaxRatio = 0.25; // 25% cap (ideal is 20%)
    for (const count of globalCounts.values()) {
      if (count / totalSlots > globalMaxRatio) {
        return true;
      }
    }
  }

  // --- Local sliding window check ---
  const windowSize = 5;
  const localMaxRatio = 0.4;

  if (questions.length >= windowSize) {
    const recent = questions.slice(-windowSize);
    const localCounts = new Map<number, number>();
    for (const q of recent) {
      for (const n of q.correctNumbers) {
        localCounts.set(n, (localCounts.get(n) ?? 0) + 1);
      }
    }
    for (const n of correctNumbers) {
      localCounts.set(n, (localCounts.get(n) ?? 0) + 1);
    }
    const localSlots = (windowSize + 1) * CORRECT_COUNT;
    for (const count of localCounts.values()) {
      if (count / localSlots > localMaxRatio) {
        return true;
      }
    }
  }

  return false;
}

function shuffleWithPatternPrevention(
  baseOptions: CandidateOption[],
  seed: number,
  questions: VocaTestQuestion[]
): TestOption[] {
  let attempt = 0;
  let bestShuffle: TestOption[] = [];
  let bestScore = Infinity;

  while (attempt < 20) {
    const shuffled = seededShuffle(baseOptions, seed + attempt).map((option, idx) => ({
      number: idx + 1,
      word: option.word,
      isCorrect: option.isCorrect,
    }));
    const correctNumbers = shuffled
      .filter((option) => option.isCorrect)
      .map((option) => option.number)
      .sort((a, b) => a - b);

    const hasRepeat = hasRepeatedCorrectPattern(questions, correctNumbers);
    const hasBias = hasPositionBias(questions, correctNumbers);

    // Perfect: no repeat and no bias
    if (!hasRepeat && !hasBias) {
      return shuffled;
    }

    // Score: lower is better (repeat is worse than bias)
    const score = (hasRepeat ? 2 : 0) + (hasBias ? 1 : 0);
    if (score < bestScore) {
      bestScore = score;
      bestShuffle = shuffled;
    }

    attempt += 1;
  }

  return bestShuffle;
}

/**
 * 교안 어휘 배열을 5지선다 VOCA TEST 문제 배열로 변환한다.
 *
 * 보기 구성: 유의어 2개(정답) + 반의어(있는 만큼, 최대 2개) + distractor(나머지)
 * 최소 요건: 유의어 2개 이상, 반의어 1개 이상
 */
/**
 * Reshuffles options within each question for random mode.
 * Applies the same pattern/bias prevention as initial generation,
 * but against the NEW question order.
 */
export function reshuffleOptionsForRandomMode(
  questions: VocaTestQuestion[],
  seed: number
): VocaTestQuestion[] {
  const result: VocaTestQuestion[] = [];

  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    const candidateOptions: CandidateOption[] = question.options.map((opt) => ({
      word: opt.word,
      isCorrect: opt.isCorrect,
    }));

    const reshuffled = shuffleWithPatternPrevention(
      candidateOptions,
      seed + i * 100,
      result
    );

    const correctNumbers = reshuffled
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.number)
      .sort((a, b) => a - b);

    result.push({
      ...question,
      options: reshuffled,
      correctNumbers,
    });
  }

  return result;
}

export function generateQuestionPool(
  vocabItems: VocabItem[],
  passageIds: string[],
  seed: number = Date.now()
): VocaTestQuestion[] {
  if (vocabItems.length === 0 || vocabItems.length !== passageIds.length) {
    return [];
  }

  const allWords = new Set<string>();
  for (const item of vocabItems) {
    allWords.add(item.word);
    item.synonyms.forEach((entry) => allWords.add(entry.word));
    item.antonyms.forEach((entry) => allWords.add(entry.word));
  }

  const questions: VocaTestQuestion[] = [];

  for (let i = 0; i < vocabItems.length; i += 1) {
    const item = vocabItems[i];
    const passageId = passageIds[i];
    const keyword = item.word.trim();

    const uniqueSynonyms = uniqueRelated(item.synonyms);
    const uniqueAntonyms = uniqueRelated(item.antonyms);

    // Minimum: 2 synonyms (correct answers) + 1 antonym
    if (uniqueSynonyms.length < CORRECT_COUNT || uniqueAntonyms.length < 1) {
      continue;
    }

    const answerWords = seededShuffle(uniqueSynonyms, seed + i * 10).slice(0, CORRECT_COUNT);
    const antonymCount = Math.min(uniqueAntonyms.length, OPTION_COUNT - CORRECT_COUNT - 1);
    const wrongWords = seededShuffle(uniqueAntonyms, seed + i * 10 + 1).slice(0, antonymCount);
    const distractorsNeeded = OPTION_COUNT - CORRECT_COUNT - antonymCount;

    const used = new Set<string>([
      wordKey(keyword),
      ...answerWords.map((entry) => wordKey(entry.word)),
      ...wrongWords.map((entry) => wordKey(entry.word)),
    ]);

    const distractorCandidates = seededShuffle(Array.from(allWords), seed + i * 10 + 2).filter(
      (word) => {
        const key = wordKey(word);
        return Boolean(key) && !used.has(key);
      }
    );
    const distractors = distractorCandidates.slice(0, distractorsNeeded);
    if (distractors.length < distractorsNeeded) {
      continue;
    }

    const options = shuffleWithPatternPrevention(
      [
        ...answerWords.map<CandidateOption>((entry) => ({
          word: entry.word,
          isCorrect: true,
        })),
        ...wrongWords.map<CandidateOption>((entry) => ({
          word: entry.word,
          isCorrect: false,
        })),
        ...distractors.map<CandidateOption>((word) => ({
          word,
          isCorrect: false,
        })),
      ],
      seed + i * 100,
      questions
    );

    const correctNumbers = options
      .filter((option) => option.isCorrect)
      .map((option) => option.number)
      .sort((a, b) => a - b);

    questions.push({
      id: `${passageId}_${item.index}`,
      keyword,
      options,
      correctNumbers,
      sourcePassageId: passageId,
    });
  }

  return questions;
}
