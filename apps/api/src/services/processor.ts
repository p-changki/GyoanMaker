export interface UsageInfo {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface GeneratedPassage {
  outputText: string;
  warnings?: string[];
  usage?: UsageInfo;
}

export interface ProcessedPassageResult {
  index: number;
  outputText: string;
  warnings?: string[];
  usage?: UsageInfo;
}

type GenerateOneFn = (
  passage: string,
  index: number
) => Promise<string | GeneratedPassage>;

function clampParallelLimit(limit: number): number {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 3;
  }
  return Math.min(5, Math.max(3, Math.floor(parsed)));
}

function normalizeResult(index: number, generated: string | GeneratedPassage): ProcessedPassageResult {
  if (typeof generated === "string") {
    return { index, outputText: generated };
  }

  return {
    index,
    outputText: generated.outputText,
    warnings: generated.warnings,
    usage: generated.usage,
  };
}

export async function processSequential(
  passages: string[],
  generateOne: GenerateOneFn
): Promise<ProcessedPassageResult[]> {
  const results: ProcessedPassageResult[] = [];

  for (let index = 0; index < passages.length; index += 1) {
    const generated = await generateOne(passages[index], index);
    results.push(normalizeResult(index, generated));
  }

  return results;
}

export async function processBoundedParallel(
  passages: string[],
  generateOne: GenerateOneFn,
  limit = 3
): Promise<ProcessedPassageResult[]> {
  const concurrency = clampParallelLimit(limit);
  const results: ProcessedPassageResult[] = new Array(passages.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;

      if (currentIndex >= passages.length) {
        return;
      }

      const generated = await generateOne(passages[currentIndex], currentIndex);
      results[currentIndex] = normalizeResult(currentIndex, generated);
    }
  }

  const workerCount = Math.min(concurrency, passages.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
