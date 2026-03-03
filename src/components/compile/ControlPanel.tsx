"use client";

import { useState } from "react";
import { useHandoutStore } from "@/stores/useHandoutStore";

interface ControlPanelProps {
  onApplyTemplate: () => void;
  onCopyAll: () => void;
  onDownloadTxt: () => void;
  onExportPdf: (customFileName?: string) => void;
  isExportingPdf: boolean;
  exportCurrent: number;
  exportTotal: number;
}

export default function ControlPanel({
  onApplyTemplate,
  onCopyAll,
  onDownloadTxt,
  onExportPdf,
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

  const [pdfFileName, setPdfFileName] = useState("");

  return (
    <aside className="w-full h-full bg-white border-l border-gray-200 overflow-y-auto p-6 flex flex-col">
      <div className="mb-10 text-center">
        <h2 className="text-base font-black text-gray-900 tracking-tight mb-1">
          Handout Control
        </h2>
        <p className="text-xs text-gray-500 font-medium italic">
          Compile & Export
        </p>
      </div>

      <div className="space-y-8 flex-1">
        {/* Template Apply Section */}
        <section className="space-y-4">
          <p className="text-[11px] font-black text-[#5E35B1] uppercase tracking-widest pl-1">
            Template Application
          </p>

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
                교안 템플릿 적용
              </button>
            )}
            <p className="text-[10px] text-gray-400 font-medium mt-3 text-center leading-relaxed">
              * AI가 생성한 20개 분석 결과를
              <br />
              교안 레이아웃으로 변환합니다.
            </p>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="space-y-3 pt-4">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
            Quick Actions
          </p>
          <button
            type="button"
            onClick={onCopyAll}
            disabled={!isReady}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-all shadow-sm"
          >
            전체 텍스트 복사
          </button>
          <button
            type="button"
            onClick={onDownloadTxt}
            disabled={!isReady}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-all shadow-sm"
          >
            TXT 다운로드
          </button>
        </section>

        {/* Export Options */}
        <section className="space-y-3 pt-4">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
            PDF Export
          </p>
          <input
            type="text"
            placeholder="저장할 파일명 입력 (선택)"
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
                PDF 추출 중... (잠시만 대기)
              </>
            ) : (
              "PDF 다운로드"
            )}
          </button>
          {isExportingPdf && exportTotal > 0 && (
            <p className="text-[10px] text-gray-400 font-bold text-center">
              진행도 {exportCurrent} / {exportTotal}
            </p>
          )}
        </section>
      </div>

      <div className="pt-8 border-t border-gray-100 text-center">
        <p className="text-[9px] text-gray-300 font-black uppercase tracking-tighter">
          GyoanMaker Enterprise v1.0
        </p>
      </div>
    </aside>
  );
}
