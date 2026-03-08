"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IllustrationBubbleStyle, IllustrationConceptMode } from "@gyoanmaker/shared/types";
import { useHandoutStore } from "@/stores/useHandoutStore";
import { TemplateSettingsPanel } from "./template-settings";
import TemplateGuideModal, { GUIDE_DISMISSED_KEY } from "./template-settings/TemplateGuideModal";

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
  const sections = useHandoutStore((state) => state.sections);
  const isReady = useHandoutStore((state) =>
    Object.values(state.sections).some((section) => section.isParsed)
  );

  const [activeTab, setActiveTab] = useState<TabKey>("actions");
  const [showGuide, setShowGuide] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [showIllustrationOptions, setShowIllustrationOptions] = useState(false);
  const [illustrationScope, setIllustrationScope] = useState<
    "all" | "stale" | "passages"
  >("all");
  const derivedConceptDefault: IllustrationConceptMode = activeSample ? "soft" : "off";
  const [conceptMode, setConceptMode] = useState<IllustrationConceptMode>(derivedConceptDefault);
  const [lastSampleId, setLastSampleId] = useState<string | null>(activeSample?.prompt ?? null);

  // Sync concept mode when activeSample changes (React recommended pattern for derived state)
  const currentSampleId = activeSample?.prompt ?? null;
  if (currentSampleId !== lastSampleId) {
    setLastSampleId(currentSampleId);
    if (currentSampleId && !lastSampleId) {
      setConceptMode("soft");
    }
  }
  const [illustrationQuality, setIllustrationQuality] = useState<
    "draft" | "standard" | "hq"
  >("standard");
  const [illustrationOverwritePolicy, setIllustrationOverwritePolicy] = useState<
    "skip_completed" | "overwrite_all" | "stale_only"
  >("skip_completed");
  const [selectedPassageIds, setSelectedPassageIds] = useState<string[]>([]);
  const [includeKoreanText, setIncludeKoreanText] = useState(false);
  const [bubbleCount, setBubbleCount] = useState(3);
  const [bubbleStyle, setBubbleStyle] = useState<IllustrationBubbleStyle>("round");
  const [customBubbleTexts, setCustomBubbleTexts] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<"scope" | "quality" | "overwrite" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const passageIds = useMemo(
    () =>
      Object.keys(sections)
        .filter((id) => Boolean(sections[id]?.rawText?.trim()))
        .sort(),
    [sections]
  );

  const canStartIllustrationJob =
    !isApplyingIllustrations &&
    (illustrationScope !== "passages" || selectedPassageIds.length > 0);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "actions", label: "Actions" },
    { key: "settings", label: "Settings" },
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
                      <span className="text-xs font-black text-[#5E35B1]">
                        Applying...
                      </span>
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

            {/* Illustration Apply */}
            <section className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedPassageIds.length === 0) {
                      setSelectedPassageIds(passageIds);
                    }
                    setShowIllustrationOptions(true);
                  }}
                  disabled={!canApplyIllustrations || isApplyingIllustrations}
                  className="w-full py-4 bg-[#F59E0B] text-white rounded-xl font-black text-sm disabled:opacity-50 hover:bg-[#D97706] active:scale-[0.98] transition-[transform,background-color,opacity]"
                >
                  {isApplyingIllustrations ? "삽화 생성 중..." : "현재 스타일로 삽화 적용"}
                </button>
{!canApplyIllustrations && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-amber-600 font-semibold">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>Info</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  먼저 교안을 저장해주세요
                </p>
                )}

                {illustrationProgress.total > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700">
                        {statusLabel}
                      </span>
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
                    <p className="text-[11px] font-bold text-gray-400">
                      {statusLabel}
                    </p>
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
                Quick Actions
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
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-[color,border-color,background-color,opacity] shadow-sm"
              >
                Copy All Text
              </button>
              <button
                type="button"
                onClick={onDownloadTxt}
                disabled={!isReady}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[#5E35B1] hover:text-[#5E35B1] disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-[color,border-color,background-color,opacity] shadow-sm"
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

      {/* Illustration Options Modal */}
      {showIllustrationOptions && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-900">삽화 생성</h3>
                <p className="mt-1 text-sm text-gray-500">
                  각 지문에 맞는 삽화를 AI가 자동으로 생성합니다
                </p>
              </div>
              <a
                href="/illustrations/concept"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                스타일 설정 →
              </a>
            </div>

            <div className="mt-5 space-y-5">
              {/* Scope */}
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-gray-700">생성 범위</span>
                <div className="relative" ref={openDropdown === "scope" ? dropdownRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "scope" ? null : "scope")}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      openDropdown === "scope"
                        ? "border-[#F59E0B] ring-1 ring-[#F59E0B]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-gray-700">
                      {{ all: "모든 지문", stale: "미완성 지문만 (미생성 · 실패 · 변경됨)", passages: "직접 선택" }[illustrationScope]}
                    </span>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === "scope" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {openDropdown === "scope" && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      {([
                        { value: "all" as const, label: "모든 지문" },
                        { value: "stale" as const, label: "미완성 지문만 (미생성 · 실패 · 변경됨)" },
                        { value: "passages" as const, label: "직접 선택" },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setIllustrationScope(opt.value); setOpenDropdown(null); }}
                          className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                            illustrationScope === opt.value
                              ? "bg-amber-50 font-semibold text-amber-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {illustrationScope === opt.value && (
                            <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          )}
                          <span className={illustrationScope === opt.value ? "" : "pl-6"}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  {illustrationScope === "all" && "전체 지문에 삽화를 생성합니다"}
                  {illustrationScope === "stale" && "아직 삽화가 없거나, 실패·변경된 지문만 생성합니다"}
                  {illustrationScope === "passages" && "아래에서 원하는 지문을 선택하세요"}
                </p>
              </label>

              {/* Passage selection */}
              {illustrationScope === "passages" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">지문 선택</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPassageIds(passageIds)}
                        className="text-xs font-semibold text-[#F59E0B] hover:text-[#D97706]"
                      >
                        전체 선택
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPassageIds([])}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600"
                      >
                        해제
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 space-y-1 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                    {passageIds.map((id) => {
                      const checked = selectedPassageIds.includes(id);
                      return (
                        <label
                          key={id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
                            checked ? "bg-amber-50" : "hover:bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            className="accent-[#F59E0B]"
                            onChange={(e) => {
                              setSelectedPassageIds((prev) => {
                                if (e.target.checked) {
                                  return prev.includes(id) ? prev : [...prev, id];
                                }
                                return prev.filter((item) => item !== id);
                              });
                            }}
                          />
                          <span className="text-xs font-medium text-gray-700">
                            지문 {id}
                          </span>
                        </label>
                      );
                    })}
                    {passageIds.length === 0 && (
                      <p className="px-2 py-1 text-xs text-gray-400">
                        선택 가능한 지문이 없습니다
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Quality */}
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-gray-700">이미지 품질</span>
                <div className="relative" ref={openDropdown === "quality" ? dropdownRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "quality" ? null : "quality")}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      openDropdown === "quality"
                        ? "border-[#F59E0B] ring-1 ring-[#F59E0B]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-gray-700">
                      {{ draft: "빠른 생성 (1 크레딧)", standard: "표준 품질 (1 크레딧)", hq: "고품질 (2 크레딧)" }[illustrationQuality]}
                    </span>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === "quality" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {openDropdown === "quality" && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      {([
                        { value: "draft" as const, label: "빠른 생성", sub: "1 크레딧" },
                        { value: "standard" as const, label: "표준 품질", sub: "1 크레딧" },
                        { value: "hq" as const, label: "고품질", sub: "2 크레딧" },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setIllustrationQuality(opt.value); setOpenDropdown(null); }}
                          className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                            illustrationQuality === opt.value
                              ? "bg-amber-50 font-semibold text-amber-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {illustrationQuality === opt.value && (
                              <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                            )}
                            <span className={illustrationQuality === opt.value ? "" : "pl-6"}>{opt.label}</span>
                          </div>
                          <span className="text-xs text-gray-400">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* Overwrite policy */}
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-gray-700">기존 삽화 처리</span>
                <div className="relative" ref={openDropdown === "overwrite" ? dropdownRef : undefined}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === "overwrite" ? null : "overwrite")}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      openDropdown === "overwrite"
                        ? "border-[#F59E0B] ring-1 ring-[#F59E0B]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-gray-700">
                      {{ skip_completed: "이미 완성된 삽화는 건너뛰기", overwrite_all: "전부 새로 생성", stale_only: "변경된 지문만 새로 생성" }[illustrationOverwritePolicy]}
                    </span>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === "overwrite" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {openDropdown === "overwrite" && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      {([
                        { value: "skip_completed" as const, label: "이미 완성된 삽화는 건너뛰기" },
                        { value: "overwrite_all" as const, label: "전부 새로 생성" },
                        { value: "stale_only" as const, label: "변경된 지문만 새로 생성" },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setIllustrationOverwritePolicy(opt.value); setOpenDropdown(null); }}
                          className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                            illustrationOverwritePolicy === opt.value
                              ? "bg-amber-50 font-semibold text-amber-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {illustrationOverwritePolicy === opt.value && (
                            <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          )}
                          <span className={illustrationOverwritePolicy === opt.value ? "" : "pl-6"}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>

              {/* Concept Mode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">컨셉 적용</span>
                  {activeSample ? (
                    <div className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeSample.imageUrl} alt="active concept" className="h-6 w-6 rounded-full object-cover" />
                      <span className="text-[11px] text-gray-500 max-w-[120px] truncate">{activeSample.prompt}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">활성 컨셉 없음</span>
                  )}
                </div>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-bold">
                  {(["soft", "hard"] as IllustrationConceptMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      disabled={!activeSample}
                      onClick={() => setConceptMode(mode)}
                      className={`flex-1 py-2 transition-colors disabled:opacity-40 ${
                        conceptMode === mode
                          ? "bg-amber-500 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {mode === "soft" ? "참고" : "강제"}
                    </button>
                  ))}
                </div>
                {conceptMode === "soft" && (
                  <p className="text-[11px] text-gray-400">지문 내용 우선 · 컨셉은 스타일 힌트로만 사용</p>
                )}
                {conceptMode === "hard" && (
                  <p className="text-[11px] text-amber-600 font-semibold">지문 내용보다 컨셉 우선 · 동물 컨셉이면 사람 배제</p>
                )}
              </div>

              {/* 한글 말풍선 포함 */}
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
                <input
                  type="checkbox"
                  checked={includeKoreanText}
                  onChange={(e) => setIncludeKoreanText(e.target.checked)}
                  className="h-5 w-5 rounded accent-orange-500"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800">한글 말풍선 포함</span>
                  <p className="text-[11px] text-gray-500">삽화에 지문 내용 기반 한글 말풍선·캡션을 넣습니다</p>
                </div>
              </label>

              {/* 말풍선 세부 옵션 (includeKoreanText 활성 시만) */}
              {includeKoreanText && (
                <div className="ml-8 mt-3 space-y-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4">
                  {/* 말풍선 개수 */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">말풍선 개수</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={bubbleCount}
                        onChange={(e) => setBubbleCount(Number(e.target.value))}
                        className="h-2 flex-1 cursor-pointer accent-orange-500"
                      />
                      <span className="w-6 text-center text-sm font-bold text-gray-800">{bubbleCount}</span>
                    </div>
                  </div>

                  {/* 말풍선 스타일 */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">말풍선 스타일</label>
                    <div className="flex gap-2">
                      {(["round", "square", "cloud"] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setBubbleStyle(style)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${bubbleStyle === style ? "border-orange-400 bg-orange-100 text-orange-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
                        >
                          {style === "round" ? "둥근형" : style === "square" ? "네모형" : "구름형"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 사용자 지정 문장 */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">
                      사용자 지정 문장 <span className="font-normal text-gray-400">(선택)</span>
                    </label>
                    <p className="mb-2 text-[11px] text-gray-400">직접 입력하면 AI가 해당 문장을 말풍선에 넣습니다 (최대 5개)</p>
                    {customBubbleTexts.map((text, i) => (
                      <div key={i} className="mb-1.5 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={text}
                          maxLength={100}
                          placeholder={`말풍선 ${i + 1}`}
                          onChange={(e) => {
                            const next = [...customBubbleTexts];
                            next[i] = e.target.value;
                            setCustomBubbleTexts(next);
                          }}
                          className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setCustomBubbleTexts(customBubbleTexts.filter((_, j) => j !== i))}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {customBubbleTexts.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setCustomBubbleTexts([...customBubbleTexts, ""])}
                        className="text-xs font-bold text-orange-500 hover:text-orange-600"
                      >
                        + 문장 추가
                      </button>
                    )}
                  </div>
                </div>
              )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowIllustrationOptions(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!canStartIllustrationJob}
                onClick={() => {
                  onApplyIllustrations({
                    scope: illustrationScope,
                    quality: illustrationQuality,
                    overwritePolicy: illustrationOverwritePolicy,
                    passageIds:
                      illustrationScope === "passages" ? selectedPassageIds : undefined,
                    conceptMode: activeSample ? conceptMode : "off",
                    conceptText: activeSample?.prompt,
                    includeKoreanText,
                    bubbleCount: includeKoreanText ? bubbleCount : undefined,
                    bubbleStyle: includeKoreanText ? bubbleStyle : undefined,
                    customBubbleTexts: includeKoreanText && customBubbleTexts.length > 0 ? customBubbleTexts : undefined,
                  });
                  setShowIllustrationOptions(false);
                }}
                className="rounded-xl bg-[#F59E0B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
              >
                삽화 생성 시작
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Credit Error Modal */}
      {illustrationCreditError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Error</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">크레딧 부족</h3>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>
                삽화 생성에 <strong className="text-gray-900">{illustrationCreditError.needed}건</strong>의
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
