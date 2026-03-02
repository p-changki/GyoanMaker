function clampParallelLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 3;
  }
  return Math.min(5, Math.max(3, Math.floor(parsed)));
}

async function processSequential(passages, generateOne) {
  const results = [];

  for (let index = 0; index < passages.length; index += 1) {
    const generated = await generateOne(passages[index], index);
    if (typeof generated === "string") {
      results.push({ index, outputText: generated });
    } else {
      results.push({
        index,
        outputText: generated.outputText,
        warnings: generated.warnings,
      });
    }
  }

  return results;
}

async function processBoundedParallel(passages, generateOne, limit = 3) {
  const concurrency = clampParallelLimit(limit);
  const results = new Array(passages.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const currentIndex = cursor;
      cursor += 1;

      if (currentIndex >= passages.length) {
        return;
      }

      const generated = await generateOne(passages[currentIndex], currentIndex);
      if (typeof generated === "string") {
        results[currentIndex] = { index: currentIndex, outputText: generated };
      } else {
        results[currentIndex] = {
          index: currentIndex,
          outputText: generated.outputText,
          warnings: generated.warnings,
        };
      }
    }
  }

  const workerCount = Math.min(concurrency, passages.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

module.exports = {
  processSequential,
  processBoundedParallel,
};
