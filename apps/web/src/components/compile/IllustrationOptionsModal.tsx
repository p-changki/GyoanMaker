"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { IllustrationBubbleStyle, IllustrationConceptMode } from "@gyoanmaker/shared/types";
import { useHandoutStore } from "@/stores/useHandoutStore";

interface IlluQuotaView {
  limit: number;
  remaining: number;
  credits: number;
}

interface ActiveConceptSample {
  imageUrl: string;
  prompt: string;
}

export interface IllustrationOptionsModalProps {
  activeSample?: ActiveConceptSample | null;
  isApplyingIllustrations: boolean;
  onConfirm: (options: {
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
  onClose: () => void;
}

export default function IllustrationOptionsModal({
  activeSample,
  isApplyingIllustrations,
  onConfirm,
  onClose,
}: IllustrationOptionsModalProps) {
  const sections = useHandoutStore((state) => state.sections);
  const { status } = useSession();
  const { data: illuQuota } = useQuery<IlluQuotaView>({
    queryKey: ["quota", "illustration"],
    queryFn: async () => {
      const res = await fetch("/api/quota");
      if (!res.ok) throw new Error("Failed to fetch quota");
      const data = await res.json();
      return data.illustration;
    },
    staleTime: 30_000,
    enabled: status === "authenticated",
    retry: false,
  });

  const passageIds = useMemo(
    () =>
      Object.keys(sections)
        .filter((id) => Boolean(sections[id]?.rawText?.trim()))
        .sort(),
    [sections]
  );

  const [illustrationScope, setIllustrationScope] = useState<"all" | "stale" | "passages">("all");
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

  const [illustrationQuality, setIllustrationQuality] = useState<"draft" | "standard" | "hq">(
    "standard"
  );
  const [illustrationOverwritePolicy, setIllustrationOverwritePolicy] = useState<
    "skip_completed" | "overwrite_all" | "stale_only"
  >("skip_completed");
  const [selectedPassageIds, setSelectedPassageIds] = useState<string[]>(passageIds);
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

  const [showTimeNotice, setShowTimeNotice] = useState(false);

  const canStartIllustrationJob =
    !isApplyingIllustrations &&
    (illustrationScope !== "passages" || selectedPassageIds.length > 0);

  const handleConfirm = () => {
    onConfirm({
      scope: illustrationScope,
      quality: illustrationQuality,
      overwritePolicy: illustrationOverwritePolicy,
      passageIds: illustrationScope === "passages" ? selectedPassageIds : undefined,
      conceptMode: activeSample ? conceptMode : "off",
      conceptText: activeSample?.prompt,
      includeKoreanText,
      bubbleCount: includeKoreanText ? bubbleCount : undefined,
      bubbleStyle: includeKoreanText ? bubbleStyle : undefined,
      customBubbleTexts:
        includeKoreanText && customBubbleTexts.length > 0 ? customBubbleTexts : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-900">일러스트 생성</h3>
            <p className="mt-1 text-sm text-gray-500">
              각 지문에 맞는 일러스트를 AI가 자동으로 생성합니다
            </p>
            {illuQuota && (
              <p className={`mt-1.5 text-xs font-bold ${
                illuQuota.remaining <= 0 ? "text-red-500" : "text-amber-600"
              }`}>
                잔여 {illuQuota.remaining}/{illuQuota.limit + illuQuota.credits}회
              </p>
            )}
          </div>
          <a
            href="/illustrations/concept"
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
                  {
                    {
                      all: "모든 지문",
                      stale: "미완성 지문만 (미생성 · 실패 · 변경됨)",
                      passages: "직접 선택",
                    }[illustrationScope]
                  }
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === "scope" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === "scope" && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {(
                    [
                      { value: "all" as const, label: "모든 지문" },
                      {
                        value: "stale" as const,
                        label: "미완성 지문만 (미생성 · 실패 · 변경됨)",
                      },
                      { value: "passages" as const, label: "직접 선택" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setIllustrationScope(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                        illustrationScope === opt.value
                          ? "bg-amber-50 font-semibold text-amber-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {illustrationScope === opt.value && (
                        <svg
                          className="h-4 w-4 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      <span className={illustrationScope === opt.value ? "" : "pl-6"}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {illustrationScope === "all" && "전체 지문에 일러스트를 생성합니다"}
              {illustrationScope === "stale" &&
                "아직 일러스트가 없거나, 실패·변경된 지문만 생성합니다"}
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
                      <span className="text-xs font-medium text-gray-700">지문 {id}</span>
                    </label>
                  );
                })}
                {passageIds.length === 0 && (
                  <p className="px-2 py-1 text-xs text-gray-400">선택 가능한 지문이 없습니다</p>
                )}
              </div>
            </div>
          )}

          {/* Quality */}
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-gray-700">이미지 품질</span>
            <div
              className="relative"
              ref={openDropdown === "quality" ? dropdownRef : undefined}
            >
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
                  {
                    {
                      draft: "빠른 생성 (1 크레딧)",
                      standard: "표준 품질 (1 크레딧)",
                      hq: "고품질 (2 크레딧)",
                    }[illustrationQuality]
                  }
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === "quality" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === "quality" && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {(
                    [
                      { value: "draft" as const, label: "빠른 생성", sub: "1 크레딧" },
                      { value: "standard" as const, label: "표준 품질", sub: "1 크레딧" },
                      { value: "hq" as const, label: "고품질", sub: "2 크레딧" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setIllustrationQuality(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                        illustrationQuality === opt.value
                          ? "bg-amber-50 font-semibold text-amber-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {illustrationQuality === opt.value && (
                          <svg
                            className="h-4 w-4 text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        <span className={illustrationQuality === opt.value ? "" : "pl-6"}>
                          {opt.label}
                        </span>
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
            <span className="text-sm font-bold text-gray-700">기존 일러스트 처리</span>
            <div
              className="relative"
              ref={openDropdown === "overwrite" ? dropdownRef : undefined}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "overwrite" ? null : "overwrite")
                }
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  openDropdown === "overwrite"
                    ? "border-[#F59E0B] ring-1 ring-[#F59E0B]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-gray-700">
                  {
                    {
                      skip_completed: "이미 완성된 일러스트는 건너뛰기",
                      overwrite_all: "전부 새로 생성",
                      stale_only: "변경된 지문만 새로 생성",
                    }[illustrationOverwritePolicy]
                  }
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${openDropdown === "overwrite" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openDropdown === "overwrite" && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {(
                    [
                      {
                        value: "skip_completed" as const,
                        label: "이미 완성된 일러스트는 건너뛰기",
                      },
                      { value: "overwrite_all" as const, label: "전부 새로 생성" },
                      { value: "stale_only" as const, label: "변경된 지문만 새로 생성" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setIllustrationOverwritePolicy(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                        illustrationOverwritePolicy === opt.value
                          ? "bg-amber-50 font-semibold text-amber-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {illustrationOverwritePolicy === opt.value && (
                        <svg
                          className="h-4 w-4 text-amber-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      <span
                        className={illustrationOverwritePolicy === opt.value ? "" : "pl-6"}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Concept Mode */}
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">컨셉 적용</span>
            {activeSample ? (
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSample.imageUrl}
                  alt="active concept"
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-[11px] text-gray-500 max-w-[120px] truncate">
                  {activeSample.prompt}
                </span>
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
            <p className="text-[11px] text-gray-400">
              지문 내용 우선 · 컨셉은 스타일 힌트로만 사용
            </p>
          )}
          {conceptMode === "hard" && (
            <p className="text-[11px] text-amber-600 font-semibold">
              지문 내용보다 컨셉 우선 · 동물 컨셉이면 사람 배제
            </p>
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
            <p className="text-[11px] text-gray-500">
              일러스트에 지문 내용 기반 한글 말풍선·캡션을 넣습니다
            </p>
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
                <span className="w-6 text-center text-sm font-bold text-gray-800">
                  {bubbleCount}
                </span>
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
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                      bubbleStyle === style
                        ? "border-orange-400 bg-orange-100 text-orange-700"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {style === "round" ? "둥근형" : style === "square" ? "네모형" : "구름형"}
                  </button>
                ))}
              </div>
            </div>

            {/* 사용자 지정 문장 */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">
                사용자 지정 문장{" "}
                <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <p className="mb-2 text-[11px] text-gray-400">
                직접 입력하면 AI가 해당 문장을 말풍선에 넣습니다 (최대 5개)
              </p>
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
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canStartIllustrationJob}
            onClick={() => setShowTimeNotice(true)}
            className="rounded-xl bg-[#F59E0B] px-5 py-2.5 text-sm font-black text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
          >
            일러스트 생성 시작
          </button>
        </div>

        {/* Time notice overlay */}
        {showTimeNotice && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm p-6">
            <div className="text-center max-w-xs space-y-4">
              <div className="text-5xl">☕</div>
              <h4 className="text-lg font-black text-gray-900">
                잠깐, 커피 한 잔 어때요?
              </h4>
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p>
                  AI가 각 지문을 분석하고 어울리는 일러스트를 그리는 데
                  <strong className="text-amber-600"> 지문당 약 30초~1분</strong> 정도 걸려요.
                </p>
                <p className="text-gray-400 text-xs">
                  생성이 시작되면 다른 작업을 하다 돌아와도 괜찮아요.
                  <br />
                  진행 상황은 화면에 계속 표시됩니다.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTimeNotice(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="rounded-xl bg-[#F59E0B] px-5 py-2 text-sm font-black text-white hover:bg-[#D97706] transition-colors"
                >
                  알겠어요, 시작!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
