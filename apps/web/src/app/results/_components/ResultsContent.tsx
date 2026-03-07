import RawResultCard from "@/components/results/RawResultCard";
import type { ResultItem } from "../_hooks/useChunkGeneration";
import ProgressPanel from "./ProgressPanel";

interface ResultsContentProps {
  results: ResultItem[];
  processed: number;
  total: number;
  progressPercent: number;
  completed: number;
  failed: number;
  generating: number;
  etaLabel: string | null;
  apiError: string | null;
  failedIds: string;
  onRegenerate: (index: number) => void;
  onRetry: (index: number) => void;
}

export default function ResultsContent({
  results,
  processed,
  total,
  progressPercent,
  completed,
  failed,
  generating,
  etaLabel,
  apiError,
  failedIds,
  onRegenerate,
  onRetry,
}: ResultsContentProps) {
  return (
    <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Generated Handouts</h1>
        <p className="text-gray-500 font-medium">
          Analysis results based on your input passages.
        </p>
      </div>

      <div className="mb-8 space-y-3">
        <ProgressPanel
          processed={processed}
          total={total}
          progressPercent={progressPercent}
          completed={completed}
          failed={failed}
          generating={generating}
          etaLabel={etaLabel}
          apiError={apiError}
          failedIds={failedIds}
        />
      </div>

      <div className="space-y-10">
        {results.map((item, index) => (
          <RawResultCard
            key={item.id}
            passageId={item.id}
            outputText={item.outputText}
            status={item.status === "pending" ? "generating" : item.status}
            enableCollapse={results.length > 1}
            onRegenerate={() => onRegenerate(index)}
            onRetry={() => onRetry(index)}
          />
        ))}
      </div>
    </main>
  );
}
