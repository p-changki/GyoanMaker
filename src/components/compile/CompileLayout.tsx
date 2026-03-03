"use client";

import SectionNav from "./SectionNav";
import PreviewCanvas from "./PreviewCanvas";
import ControlPanel from "./ControlPanel";

interface CompileLayoutProps {
  onApplyTemplate: () => void;
  onCopyAll: () => void;
  onDownloadTxt: () => void;
  onExportPdf: (customFileName?: string) => void;
  isExportingPdf: boolean;
  exportCurrent: number;
  exportTotal: number;
}

export default function CompileLayout({
  onApplyTemplate,
  onCopyAll,
  onDownloadTxt,
  onExportPdf,
  isExportingPdf,
  exportCurrent,
  exportTotal,
}: CompileLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Header Placeholder (Global Header is already on the page) */}

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Navigation (260px 고정) */}
        <div className="w-[260px] shrink-0">
          <SectionNav />
        </div>

        {/* Center: Preview Canvas (flex-1, min-w-0 필수) */}
        <div className="flex-1 min-w-0">
          <PreviewCanvas />
        </div>

        {/* Right: Control Panel (320px 고정) */}
        <div className="w-[320px] shrink-0">
          <ControlPanel
            onApplyTemplate={onApplyTemplate}
            onCopyAll={onCopyAll}
            onDownloadTxt={onDownloadTxt}
            onExportPdf={onExportPdf}
            isExportingPdf={isExportingPdf}
            exportCurrent={exportCurrent}
            exportTotal={exportTotal}
          />
        </div>
      </div>
    </div>
  );
}
