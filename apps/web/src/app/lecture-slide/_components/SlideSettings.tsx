"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import {
  useLectureSlideStore,
  PRESET_THEMES,
  FONT_OPTIONS,
  FONT_KEY_LABELS,
  type FontValue,
  type SlideFontKey,
} from "../_hooks/useLectureSlideStore";

const PRESET_LABELS: Record<string, string> = {
  dark: "다크",
  light: "라이트",
  blue: "블루",
  custom: "커스텀",
};

// ─── Custom Dropdown Select ──────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const btnCls = small
    ? "flex-1 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/40 px-2.5 py-1.5 text-xs font-medium text-gray-800 shadow-sm transition hover:border-indigo-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/50"
    : "w-full flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-indigo-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/50";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((p) => !p)} className={btnCls}>
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`shrink-0 text-indigo-400 transition ${open ? "rotate-180" : ""} ${small ? "ml-1 h-3 w-3" : "ml-2 h-3.5 w-3.5"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul className="absolute left-0 z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-indigo-200 bg-white py-1 shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-indigo-50 ${
                  o.value === value ? "font-semibold text-indigo-600" : "text-gray-700"
                }`}
              >
                {o.value === value && (
                  <svg className="h-3.5 w-3.5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {o.value !== value && <span className="h-3.5 w-3.5 shrink-0" />}
                <span>{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Font Settings (collapsible) ─────────────────────────────────────────────

function FontSettingsSection({
  fonts,
  setFontFor,
  setAllFonts,
}: {
  fonts: Record<SlideFontKey, FontValue>;
  setFontFor: (key: SlideFontKey, value: FontValue) => void;
  setAllFonts: (font: FontValue) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const allSame = Object.values(fonts).every((v) => v === fonts.badgeFont);
  const bulkValue = allSame ? fonts.badgeFont : "";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">폰트</p>
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
        >
          {expanded ? "접기 ▴" : "개별 설정 ▾"}
        </button>
      </div>

      {/* 전체 일괄 변경 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">전체 일괄</label>
        <StyledSelect
          value={bulkValue}
          onChange={(v) => setAllFonts(v as FontValue)}
          options={FONT_OPTIONS}
          placeholder={allSame ? undefined : "— 혼합 —"}
        />
      </div>

      {/* 개별 설정 (접힘 가능) */}
      {expanded && (
        <div className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
            영역별 폰트
          </p>
          {(Object.entries(FONT_KEY_LABELS) as [SlideFontKey, string][]).map(
            ([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs font-medium text-gray-600">
                  {label}
                </span>
                <StyledSelect
                  value={fonts[key]}
                  onChange={(v) => setFontFor(key, v as FontValue)}
                  options={FONT_OPTIONS}
                  small
                />
              </div>
            )
          )}
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        돋움·Times New Roman은 PPT 열람 시 시스템 폰트 적용됩니다.
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SlideSettings() {
  const config = useLectureSlideStore((s) => s.config);
  const sections = useLectureSlideStore((s) => s.sections);
  const setStep = useLectureSlideStore((s) => s.setStep);
  const applyPreset = useLectureSlideStore((s) => s.applyPreset);
  const updateTheme = useLectureSlideStore((s) => s.updateTheme);
  const setFontFor = useLectureSlideStore((s) => s.setFontFor);
  const setAllFonts = useLectureSlideStore((s) => s.setAllFonts);
  const setLogo = useLectureSlideStore((s) => s.setLogo);
  const setLogoWidth = useLectureSlideStore((s) => s.setLogoWidth);
  const toggleInclude = useLectureSlideStore((s) => s.toggleInclude);
  const toggleShowKorean = useLectureSlideStore((s) => s.toggleShowKorean);
  const setTitleFontSize = useLectureSlideStore((s) => s.setTitleFontSize);
  const setBodyFontSize = useLectureSlideStore((s) => s.setBodyFontSize);
  const setPassTitle = useLectureSlideStore((s) => s.setPassTitle);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [setLogo]
  );

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 2</p>
        <h2 className="text-2xl font-bold text-gray-900">슬라이드 설정</h2>
      </header>

      {/* ── 슬라이드 구성 ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">슬라이드 구성</p>
        {(
          [
            { key: "includeTopicSummary", label: "주제 + 요약" },
            { key: "includeSentences", label: "문장 목록" },
            { key: "includeVocab", label: "핵심 어휘 표" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config[key]}
              onChange={() => toggleInclude(key)}
              className="h-4 w-4 accent-indigo-600"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* ── 테마 프리셋 ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">테마</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PRESET_THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                config.preset === key
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <span
                className="h-4 w-4 rounded-sm border border-gray-300"
                style={{ background: `#${t.bg}` }}
              />
              {PRESET_LABELS[key]}
            </button>
          ))}
        </div>

        {/* 커스텀 색상 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {(
            [
              { field: "bg", label: "배경색" },
              { field: "titleColor", label: "제목색" },
              { field: "badgeBg", label: "뱃지 배경" },
              { field: "badgeText", label: "뱃지 텍스트" },
              { field: "bodyText", label: "본문색" },
            ] as const
          ).map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2">
              <input
                type="color"
                value={`#${config.theme[field]}`}
                onChange={(e) =>
                  updateTheme({ [field]: e.target.value.replace("#", "") })
                }
                className="h-8 w-8 cursor-pointer rounded border border-gray-200"
              />
              <span className="text-xs text-gray-600">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 폰트 ─────────────────────────────────────────────────────── */}
      <FontSettingsSection
        fonts={config.fonts}
        setFontFor={setFontFor}
        setAllFonts={setAllFonts}
      />

      {/* ── 로고 ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">로고 (선택)</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
          >
            이미지 업로드
          </button>
          {config.logoDataUrl && (
            <button
              type="button"
              onClick={() => setLogo(null)}
              className="text-xs text-red-500 hover:underline"
            >
              제거
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
        {config.logoDataUrl && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.logoDataUrl}
              alt="로고 미리보기"
              className="h-12 rounded border border-gray-200 object-contain"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">크기</span>
              <input
                type="range"
                min={20}
                max={150}
                value={config.logoWidth}
                onChange={(e) => setLogoWidth(Number(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="w-10 text-right text-xs text-gray-600">
                {config.logoWidth}px
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 편집 옵션 ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <p className="text-sm font-semibold text-gray-700">편집 옵션</p>

        {/* 한국어 표시 */}
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">한국어 해석 표시</span>
          <button
            type="button"
            role="switch"
            aria-checked={config.showKorean}
            onClick={toggleShowKorean}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.showKorean ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                config.showKorean ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>

        {/* 제목 폰트 크기 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">제목 크기</span>
            <span className="text-xs text-gray-500">{config.titleFontSize}pt</span>
          </div>
          <input
            type="range"
            min={14}
            max={28}
            value={config.titleFontSize}
            onChange={(e) => setTitleFontSize(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>14pt</span><span>28pt</span>
          </div>
        </div>

        {/* 본문 폰트 크기 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">본문 크기</span>
            <span className="text-xs text-gray-500">{config.bodyFontSize}pt</span>
          </div>
          <input
            type="range"
            min={10}
            max={22}
            value={config.bodyFontSize}
            onChange={(e) => setBodyFontSize(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>10pt</span><span>22pt</span>
          </div>
        </div>
      </div>

      {/* ── 지문 제목 편집 ────────────────────────────────────────────── */}
      {sections.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">지문 제목 편집</p>
          <p className="text-xs text-gray-400">
            슬라이드 상단에 표시되는 지문 제목을 직접 입력할 수 있습니다.
          </p>
          {sections.map((_, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-gray-500 w-12">
                지문 {idx + 1}
              </span>
              <input
                type="text"
                value={config.passTitles[idx] ?? ""}
                onChange={(e) => setPassTitle(idx, e.target.value)}
                placeholder={`지문 ${idx + 1}번`}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* ── 네비게이션 ───────────────────────────────────────────────── */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700"
        >
          미리보기 →
        </button>
      </div>
    </section>
  );
}
