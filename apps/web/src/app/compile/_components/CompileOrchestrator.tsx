"use client";

import { useRouter } from "next/navigation";
import CompileLayout from "@/components/compile/CompileLayout";
import { useCompileData } from "../_hooks/useCompileData";

function LoadingState() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#5E35B1] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black text-[#5E35B1] animate-pulse uppercase tracking-widest">
          Loading Layout...
        </p>
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
    handleApplyTemplate,
    handleCopyAll,
    handleDownloadTxt,
    handleExportPDF,
    handleSave,
    handleSaveConfirm,
  } = useCompileData();

  if (isLoading) {
    return <LoadingState />;
  }

  if (errorMessage) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="text-sm font-black text-red-600 uppercase tracking-widest">
            Compile Error
          </p>
          <p className="text-sm text-gray-600 font-medium">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push("/generate")}
            className="px-6 py-2 bg-[#5E35B1] text-white rounded-xl font-bold text-sm"
          >
            Go Home
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
            No input data found
          </p>
          <button
            type="button"
            onClick={() => router.push("/generate")}
            className="px-6 py-2 bg-[#5E35B1] text-white rounded-xl font-bold text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CompileLayout
        onApplyTemplate={handleApplyTemplate}
        onCopyAll={handleCopyAll}
        onDownloadTxt={handleDownloadTxt}
        onExportPdf={handleExportPDF}
        onSave={handleSave}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        isExportingPdf={isExportingPdf}
        exportCurrent={exportProgress.current}
        exportTotal={exportProgress.total}
      />

      {showSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Save Handout</h3>
              <p className="text-sm text-gray-500 mt-1">Enter a name for the handout.</p>
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
              <p className="text-xs text-gray-400 mt-2">Leave empty to use today&apos;s date.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfirm}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
