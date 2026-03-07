import CopyButton from "@/components/CopyButton";
import { normalizeHandoutRawText } from "@/lib/normalizeHandoutRawText";
import type { ResultItem } from "../_hooks/useChunkGeneration";

interface ResultActionsProps {
  results: ResultItem[];
  completed: number;
  failed: number;
  generating: number;
  isCancelling: boolean;
  onCancelGeneration: () => void;
  onRetryFailedOnly: () => void;
  onMoveToCompile: () => void;
}

export default function ResultActions({
  results,
  completed,
  failed,
  generating,
  isCancelling,
  onCancelGeneration,
  onRetryFailedOnly,
  onMoveToCompile,
}: ResultActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {generating > 0 && (
        <button
          type="button"
          onClick={onCancelGeneration}
          disabled={isCancelling}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-black text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-60 disabled:hover:bg-red-500 transition-all"
        >
          {isCancelling ? "Stopping..." : "Stop Generation"}
        </button>
      )}

      <CopyButton
        getText={() =>
          results
            .filter((r) => r.status === "completed")
            .map((r) => `【${r.id}】\n${normalizeHandoutRawText(r.outputText)}`)
            .join("\n\n---\n\n")
        }
        label="Copy All"
        className="bg-white border-gray-200 hover:border-gray-300 shadow-sm rounded-xl font-bold text-xs h-9 px-4"
        disabled={completed === 0}
      />

      {failed > 0 && (
        <button
          type="button"
          onClick={onRetryFailedOnly}
          disabled={generating > 0}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-black text-white bg-amber-500 rounded-xl hover:bg-amber-600 disabled:opacity-60 disabled:hover:bg-amber-500 transition-all"
        >
          Retry Failed ({failed})
        </button>
      )}

      <button
        type="button"
        onClick={onMoveToCompile}
        className="inline-flex items-center justify-center px-6 py-2.5 text-[13px] font-black text-white bg-[#5E35B1] rounded-xl hover:bg-[#4527A0] transition-all shadow-xl shadow-purple-100 hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-right-4 duration-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <title>Compile handout icon</title>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        Compile Handout
      </button>
    </div>
  );
}
