"use client";

import { useState } from "react";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { TemplateSettingsPanel } from "./template-settings";
import TemplateGuideModal, { GUIDE_DISMISSED_KEY } from "./template-settings/TemplateGuideModal";

type TabKey = "actions" | "settings";

interface ControlPanelProps {
  onApplyTemplate: () => void;
  onCopyAll: () => void;
  onDownloadTxt: () => void;
  onExportPdf: (customFileName?: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  isExportingPdf: boolean;
  exportCurrent: number;
  exportTotal: number;
}

export default function ControlPanel({
  onApplyTemplate,
  onCopyAll,
  onDownloadTxt,
  onExportPdf,
  onSave,
  isSaving,
  saveSuccess,
  isExportingPdf,
  exportCurrent,
  exportTotal,
}: ControlPanelProps) {
  const isApplying = useHandoutStore((state) => state.isApplying);
  const progress = useHandoutStore((state) => state.progress);
  const total = useHandoutStore((state) => state.total);
  const isReady = useHandoutStore((state) =>
    Object.values(state.sections).some((section) => section.isParsed)
  );

  const [activeTab, setActiveTab] = useState<TabKey>("actions");
  const [showGuide, setShowGuide] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");

  const TABS: { key: TabKey; label: string }[] = [
    { key: "actions", label: "Actions" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <aside className="w-full h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "settings" && !localStorage.getItem(GUIDE_DISMISSED_KEY)) {
                setShowGuide(true);
              }
            }}
            className={`flex-1 py-3.5 text-xs font-bold tracking-wide transition-colors ${
              activeTab === tab.key
                ? "text-[#5E35B1] border-b-2 border-[#5E35B1] bg-white"
                : "text-gray-400 hover:text-gray-600 bg-gray-50/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "actions" ? (
          <div className="space-y-8">
            {/* Template Apply */}
            <section className="space-y-4">
              <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 shadow-sm">
                {isApplying ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-[#5E35B1]">
                        Applying...
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {progress} / {total}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-purple-100">
                      <div
                        className="h-full bg-[#5E35B1] transition-all duration-300 ease-out"
                        style={{ width: `${(progress / total) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onApplyTemplate}
                    className="w-full py-4 bg-[#5E35B1] text-white rounded-xl font-black text-sm shadow-xl shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Apply Handout Template
                  </button>
                )}
                <p className="text-[10px] text-gray-400 font-medium mt-3 text-center leading-relaxed">
                  * Converts 20 AI-generated analysis results
                  <br />
                  into handout layout.
                </p>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
                Quick Actions
              </p>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!isReady || isSaving}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    saveSuccess
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-600"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-[#5E35B1] hover:text-[#5E35B1]"
                  } disabled:opacity-40`}
                >
                  {isSaving
                    ? "Saving..."
                    : saveSuccess
                      ? "Saved!"
                      : "Save Handout"}
                </button>
              )}
              <button
                type="button"
                onClick={onCopyAll}
                disabled={!isReady}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-all shadow-sm"
              >
                Copy All Text
              </button>
              <button
                type="button"
                onClick={onDownloadTxt}
                disabled={!isReady}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-all shadow-sm"
              >
                Download TXT
              </button>
            </section>

            {/* PDF Export */}
            <section className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
                PDF Export
              </p>
              <input
                type="text"
                placeholder="Enter file name (optional)"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                disabled={!isReady || isExportingPdf}
                className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] transition-all disabled:bg-gray-50 disabled:text-gray-400 shadow-sm"
              />
              <button
                type="button"
                onClick={() => onExportPdf(pdfFileName)}
                disabled={!isReady || isExportingPdf}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 border border-dashed border-gray-300 text-gray-400 rounded-xl font-bold text-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isExportingPdf ? (
                  <>
                    <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Exporting PDF... (please wait)
                  </>
                ) : (
                  "Download PDF"
                )}
              </button>
              {isExportingPdf && exportTotal > 0 && (
                <p className="text-[10px] text-gray-400 font-bold text-center">
                  Progress {exportCurrent} / {exportTotal}
                </p>
              )}
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold text-gray-400 hover:text-[#5E35B1] border border-dashed border-gray-200 hover:border-[#5E35B1]/30 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <title>Guide</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              사용 가이드
            </button>
            <TemplateSettingsPanel />
          </div>
        )}
      </div>

      <div className="shrink-0 py-3 border-t border-gray-100 text-center">
        <p className="text-[9px] text-gray-300 font-black uppercase tracking-tighter">
          GyoanMaker Enterprise v1.0
        </p>
      </div>

      <TemplateGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </aside>
  );
}
