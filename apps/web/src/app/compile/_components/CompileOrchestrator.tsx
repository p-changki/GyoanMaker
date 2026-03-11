"use client";

import { useRouter } from "next/navigation";
import CompileLayout from "@/components/compile/CompileLayout";
import SectionEditModal from "@/components/compile/SectionEditModal";
import { useCompileData } from "../_hooks/useCompileData";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-100 ${className ?? ""}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Center: Preview area */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-start pt-12 px-8 gap-6 overflow-auto bg-gray-50/50">
          {/* Simulated A4 page */}
          <div className="w-full max-w-[595px] bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-5">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-5/6" />
            <SkeletonBlock className="h-3 w-4/6" />
            <div className="pt-4 space-y-3">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-5/6" />
              <SkeletonBlock className="h-3 w-3/4" />
            </div>
            <div className="pt-4 space-y-3">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-4/5" />
            </div>
          </div>
        </div>

        {/* Right: Control panel */}
        <div className="w-[320px] shrink-0 border-l border-gray-200 p-5 space-y-6">
          <SkeletonBlock className="h-8 w-full rounded-lg" />
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompileOrchestrator() {
  const router = useRouter();
  const {
    handoutId,
    inputData,
    isLoading,
    errorMessage,
    isExportingPdf,
    exportProgress,
    saveSuccess,
    showSaveModal,
    saveTitle,
    setSaveTitle,
    setShowSaveModal,
    isSaving,
    isApplyingIllustrations,
    illustrationJobId,
    illustrationProgress,
    illustrationMessage,
    illustrationCreditError,
    setIllustrationCreditError,
    handleApplyTemplate,
    handleApplyIllustrations,
    handleRetryIllustrations,
    handleCancelIllustrations,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
    handleSave,
    handleSaveConfirm,
    storageLimitError,
    setStorageLimitError,
    activeSample,
  } = useCompileData();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-sm font-black text-red-600 uppercase tracking-widest">
            편집 오류
          </p>
          <p className="text-sm text-gray-600 font-medium">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/generate")}
            className="px-6 py-2 bg-[#5E35B1] text-white rounded-xl font-bold text-sm"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (!inputData && !handoutId) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-black text-gray-500 uppercase tracking-widest">
            입력 데이터 없음
          </p>
          <button
            type="button"
            onClick={() => router.push("/generate")}
            className="px-6 py-2 bg-[#5E35B1] text-white rounded-xl font-bold text-sm"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SectionEditModal />
      <CompileLayout
        onApplyTemplate={handleApplyTemplate}
        activeSample={activeSample}
        onApplyIllustrations={handleApplyIllustrations}
        onRetryIllustrations={handleRetryIllustrations}
        onCancelIllustrations={handleCancelIllustrations}
        onCopyAll={handleCopyAll}
        onDownloadTxt={handleDownloadTxt}
        onExportPdf={handleExportPDF}
        onSave={handleSave}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        canApplyIllustrations={Boolean(handoutId)}
        isApplyingIllustrations={isApplyingIllustrations}
        illustrationProgress={illustrationProgress}
        illustrationMessage={illustrationMessage}
        illustrationCreditError={illustrationCreditError}
        onDismissCreditError={() => setIllustrationCreditError(null)}
        hasRetryableIllustrations={
          Boolean(illustrationJobId) && illustrationProgress.failed > 0
        }
        canCancelIllustrations={
          Boolean(illustrationJobId) &&
          (illustrationProgress.status === "queued" ||
            illustrationProgress.status === "running")
        }
        isExportingPdf={isExportingPdf}
        exportCurrent={exportProgress.current}
        exportTotal={exportProgress.total}
      />

      {showSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">교안 저장</h3>
              <p className="text-sm text-gray-500 mt-1">교안 이름을 입력하세요.</p>
            </div>
            <div className="px-6 py-5">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={`Handout ${new Date().toLocaleDateString("en-US")}`}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveConfirm();
                }}
              />
              <p className="text-xs text-gray-400 mt-2">비워두면 오늘 날짜가 사용됩니다.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveConfirm}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {storageLimitError && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-8 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-black text-gray-900">저장 한도 초과</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                현재 플랜의 교안 저장 한도에 도달했습니다.<br />
                기존 교안을 삭제하거나 플랜을 업그레이드해주세요.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStorageLimitError(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#5E35B1] rounded-xl hover:bg-[#4527A0] transition-colors"
              >
                플랜 업그레이드
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
