"use client";

import { useRouter } from "next/navigation";
import ActionBar from "@/components/ActionBar";
import Toast from "@/components/Toast";
import ResultActions from "./_components/ResultActions";
import ResultsContent from "./_components/ResultsContent";
import { useChunkGeneration } from "./_hooks/useChunkGeneration";

export default function ResultsPage() {
  const router = useRouter();
  const {
    isLoading,
    inputData,
    results,
    apiError,
    isCancelling,
    toast,
    setToast,
    metrics,
    handleRegenerate,
    handleRetry,
    handleRetryFailedOnly,
    handleCancelGeneration,
  } = useChunkGeneration();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!inputData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-4">
        <p className="text-gray-600">No input data found.</p>
        <button
          type="button"
          onClick={() => router.push("/generate")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ActionBar
        completed={metrics.processed}
        total={metrics.total}
        onBack={() => router.push("/generate")}
      >
        <ResultActions
          results={results}
          completed={metrics.completed}
          failed={metrics.failed}
          generating={metrics.generating}
          isCancelling={isCancelling}
          onCancelGeneration={handleCancelGeneration}
          onRetryFailedOnly={handleRetryFailedOnly}
          onMoveToCompile={() => router.push("/compile")}
        />
      </ActionBar>

      <ResultsContent
        results={results}
        processed={metrics.processed}
        total={metrics.total}
        progressPercent={metrics.progressPercent}
        completed={metrics.completed}
        failed={metrics.failed}
        generating={metrics.generating}
        etaLabel={metrics.etaLabel}
        apiError={apiError}
        failedIds={metrics.failedIds}
        onRegenerate={handleRegenerate}
        onRetry={handleRetry}
      />
    </div>
  );
}
