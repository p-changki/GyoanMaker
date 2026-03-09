"use client";

import { useState } from "react";
import type { IllustrationBubbleStyle, IllustrationConceptMode } from "@gyoanmaker/shared/types";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { TemplateSettingsPanel } from "./template-settings";
import TemplateGuideModal, { GUIDE_DISMISSED_KEY } from "./template-settings/TemplateGuideModal";
import IllustrationOptionsModal from "./IllustrationOptionsModal";

type TabKey = "actions" | "settings";

interface ActiveConceptSample {
  imageUrl: string;
  prompt: string;
}

interface ControlPanelProps {
  onApplyTemplate: () => void;
  activeSample?: ActiveConceptSample | null;
  onApplyIllustrations: (options: {
    scope: "all" | "stale" | "passages";
    quality: "draft" | "standard" | "hq";
    overwritePolicy: "skip_completed" | "overwrite_all" | "stale_only";
    passageIds?: string[];
    conceptMode?: IllustrationConceptMode;
    conceptText?: string;
    includeKoreanText?: boolean;
    bubbleCount?: number;
    bubbleStyle?: IllustrationBubbleStyle;
    customBubbleTexts?: string[];
  }) => void;
  onRetryIllustrations: () => void;
  onCancelIllustrations: () => void;
  onCopyAll: () => void;
  onDownloadTxt: () => void;
  onExportPdf: (customFileName?: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  canApplyIllustrations: boolean;
  isApplyingIllustrations: boolean;
  illustrationProgress: {
    status: string;
    completed: number;
    failed: number;
    total: number;
  };
  illustrationMessage: string | null;
  illustrationCreditError: { needed: number; available: number } | null;
  onDismissCreditError: () => void;
  hasRetryableIllustrations: boolean;
  canCancelIllustrations: boolean;
  isExportingPdf: boolean;
  exportCurrent: number;
  exportTotal: number;
}

const STATUS_LABELS: Record<string, string> = {
  idle: "대기 중",
  queued: "대기열",
  running: "생성 중",
  completed: "완료",
  partial_failed: "일부 실패",
  failed: "실패",
  canceled: "취소됨",
};

export default function ControlPanel({
  onApplyTemplate,
  activeSample,
  onApplyIllustrations,
  onRetryIllustrations,
  onCancelIllustrations,
  onCopyAll,
  onDownloadTxt,
  onExportPdf,
  onSave,
  isSaving,
  saveSuccess,
  canApplyIllustrations,
  isApplyingIllustrations,
  illustrationProgress,
  illustrationMessage,
  illustrationCreditError,
  onDismissCreditError,
  hasRetryableIllustrations,
  canCancelIllustrations,
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
  const [showIllustrationOptions, setShowIllustrationOptions] = useState(false);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "actions", label: "실행" },
    { key: "settings", label: "설정" },
  ];

  const statusLabel = STATUS_LABELS[illustrationProgress.status] ?? illustrationProgress.status;

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
                      <span className="text-xs font-black text-[#5E35B1]">적용 중...</span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {progress} / {total}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-purple-100">
                      <div
                        className="h-full bg-[#5E35B1] transition-[width] duration-300 ease-out"
                        style={{ width: `${(progress / total) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onApplyTemplate}
                    className="w-full py-4 bg-[#5E35B1] text-white rounded-xl font-black text-sm shadow-md shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-[transform,background-color]"
                  >
                    교안 템플릿 적용
                  </button>
                )}
                <p className="text-[10px] text-gray-400 font-medium mt-3 text-center leading-relaxed">
                  * AI 분석 결과를 교안 레이아웃으로 변환합니다.
                </p>
              </div>
            </section>

            {/* Illustration Apply */}
            <section className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowIllustrationOptions(true)}
                  disabled={!canApplyIllustrations || isApplyingIllustrations}
                  className="w-full py-4 bg-[#F59E0B] text-white rounded-xl font-black text-sm disabled:opacity-50 hover:bg-[#D97706] active:scale-[0.98] transition-[transform,background-color,opacity]"
                >
                  {isApplyingIllustrations ? "일러스트 생성 중..." : "현재 스타일로 일러스트 적용"}
                </button>
                {!canApplyIllustrations && (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-amber-600 font-semibold">
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>Info</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    먼저 교안을 저장해주세요
                  </p>
                )}

                {illustrationProgress.total > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700">{statusLabel}</span>
                      <span className="text-[11px] text-gray-500">
                        {illustrationProgress.completed} / {illustrationProgress.total}건
                        {illustrationProgress.failed > 0 && (
                          <span className="text-red-500 ml-1">
                            (실패 {illustrationProgress.failed}건)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white border border-amber-100">
                      <div
                        className="h-full bg-[#F59E0B] transition-[width] duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (illustrationProgress.completed /
                              Math.max(1, illustrationProgress.total)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                    {illustrationMessage && (
                      <p className="text-[11px] text-gray-600">{illustrationMessage}</p>
                    )}
                  </div>
                )}

                {!illustrationProgress.total && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-gray-400">{statusLabel}</p>
                  </div>
                )}

                {hasRetryableIllustrations && (
                  <button
                    type="button"
                    onClick={onRetryIllustrations}
                    disabled={isApplyingIllustrations}
                    className="mt-3 w-full rounded-lg border border-amber-300 bg-white py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
                  >
                    실패한 항목 재시도
                  </button>
                )}
                {canCancelIllustrations && (
                  <button
                    type="button"
                    onClick={onCancelIllustrations}
                    disabled={isApplyingIllustrations}
                    className="mt-2 w-full rounded-lg border border-red-200 bg-white py-2 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    생성 취소
                  </button>
                )}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
                빠른 실행
              </p>
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!isReady || isSaving}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm transition-[color,border-color,background-color,opacity] shadow-sm ${
                    saveSuccess
                      ? "bg-emerald-50 border border-emerald-300 text-emerald-600"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-[#5E35B1] hover:text-[#5E35B1]"
                  } disabled:opacity-40`}
                >
                  {isSaving ? "저장 중..." : saveSuccess ? "저장됨!" : "교안 저장"}
                </button>
              )}
              <button
                type="button"
                onClick={onCopyAll}
                disabled={!isReady}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-[color,border-color,background-color,opacity] shadow-sm"
              >
                전체 텍스트 복사
              </button>
              <button
                type="button"
                onClick={onDownloadTxt}
                disabled={!isReady}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-[color,border-color,background-color,opacity] shadow-sm"
              >
                TXT 다운로드
              </button>
            </section>

            {/* PDF Export */}
            <section className="space-y-3">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-1">
                PDF 내보내기
              </p>
              <input
                type="text"
                placeholder="파일명 입력 (선택)"
                value={pdfFileName}
                onChange={(e) => setPdfFileName(e.target.value)}
                disabled={!isReady || isExportingPdf}
                className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] transition-[border-color,box-shadow,background-color,color] disabled:bg-gray-50 disabled:text-gray-400 shadow-sm"
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
                    PDF 내보내기 중... (잠시만 기다려 주세요)
                  </>
                ) : (
                  "PDF 다운로드"
                )}
              </button>
              {isExportingPdf && exportTotal > 0 && (
                <p className="text-[10px] text-gray-400 font-bold text-center">
                  진행 {exportCurrent} / {exportTotal}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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

      {/* Illustration Options Modal */}
      {showIllustrationOptions && (
        <IllustrationOptionsModal
          activeSample={activeSample}
          isApplyingIllustrations={isApplyingIllustrations}
          onConfirm={onApplyIllustrations}
          onClose={() => setShowIllustrationOptions(false)}
        />
      )}

      {/* Credit Error Modal */}
      {illustrationCreditError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Error</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">크레딧 부족</h3>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>
                일러스트 생성에{" "}
                <strong className="text-gray-900">{illustrationCreditError.needed}건</strong>의
                크레딧이 필요하지만, 현재
                <strong className="text-red-600"> {illustrationCreditError.available}건</strong>만
                남아있습니다.
              </p>
              <p className="text-xs text-gray-400">
                크레딧을 충전하거나 적용할 지문 수를 줄여주세요.
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onDismissCreditError}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
              >
                닫기
              </button>
              <a
                href="/account?topup=illustration"
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-blue-700"
              >
                크레딧 충전
              </a>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
