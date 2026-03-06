import type { ReactNode } from "react";

interface ProgressPanelProps {
  processed: number;
  total: number;
  progressPercent: number;
  completed: number;
  failed: number;
  generating: number;
  etaLabel: string | null;
  apiError: string | null;
  failedIds: string;
  headerSlot?: ReactNode;
}

export default function ProgressPanel({
  processed,
  total,
  progressPercent,
  completed,
  failed,
  generating,
  etaLabel,
  apiError,
  failedIds,
  headerSlot,
}: ProgressPanelProps) {
  return (
    <>
      {headerSlot}

      {total > 0 && (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          진행 {processed}/{total} ({progressPercent}%)
          {completed > 0 ? ` · 완료 ${completed}` : ""}
          {failed > 0 ? ` · 실패 ${failed}` : ""}
          {generating > 0 ? ` · 생성 중 ${generating}` : ""}
          {etaLabel && generating > 0 ? ` · 예상 ${etaLabel}` : ""}
        </p>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <strong>API 오류:</strong> {apiError}
        </div>
      )}

      {failedIds && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <strong>실패 항목:</strong> {failedIds}
        </div>
      )}
    </>
  );
}
