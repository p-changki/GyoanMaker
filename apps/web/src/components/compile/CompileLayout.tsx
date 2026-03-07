"use client";

import { useState } from "react";
import SectionNav from "./SectionNav";
import PreviewCanvas from "./PreviewCanvas";
import ControlPanel from "./ControlPanel";

interface CompileLayoutProps {
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

export default function CompileLayout({
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
}: CompileLayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Toggle button — fixed left edge */}
        <button
          type="button"
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="absolute top-4 left-3 z-30 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-purple-50 hover:border-[#5E35B1] transition-colors group"
          title={isNavOpen ? "Close list" : "Passage list"}
        >
          <svg
            className={`w-4 h-4 text-gray-500 group-hover:text-[#5E35B1] transition-transform ${isNavOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Backdrop overlay */}
        {isNavOpen && (
          <div
            className="absolute inset-0 bg-black/20 z-20"
            onClick={() => setIsNavOpen(false)}
          />
        )}

        {/* Left: Navigation — slide-over drawer */}
        <div
          className={`absolute top-0 left-0 h-full w-[260px] z-20 bg-white shadow-xl transition-transform duration-200 ease-out ${
            isNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="pt-14">
            <SectionNav onNavigate={() => setIsNavOpen(false)} />
          </div>
        </div>

        {/* Center: Preview Canvas (flex-1, min-w-0) */}
        <div className="flex-1 min-w-0">
          <PreviewCanvas />
        </div>

        {/* Right: Control Panel (320px) */}
        <div className="w-[320px] shrink-0">
          <ControlPanel
            onApplyTemplate={onApplyTemplate}
            onCopyAll={onCopyAll}
            onDownloadTxt={onDownloadTxt}
            onExportPdf={onExportPdf}
            onSave={onSave}
            isSaving={isSaving}
            saveSuccess={saveSuccess}
            isExportingPdf={isExportingPdf}
            exportCurrent={exportCurrent}
            exportTotal={exportTotal}
          />
        </div>
      </div>
    </div>
  );
}
