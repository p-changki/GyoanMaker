"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IllustrationAspectRatio,
  IllustrationProfile,
  IllustrationQuality,
  IllustrationStylePreset,
} from "@gyoanmaker/shared/types";

interface AdvancedSettingsPanelProps {
  profile: IllustrationProfile | undefined;
  isOpen: boolean;
  onToggle: () => void;
}

type ProfilePatch = Partial<
  Pick<
    IllustrationProfile,
    | "styleEnabled"
    | "styleName"
    | "characterGuide"
    | "palette"
    | "lineStyle"
    | "mood"
    | "negativePrompt"
    | "defaultQuality"
    | "aspectRatio"
  >
>;

function qualityLabel(q: IllustrationQuality): string {
  if (q === "draft") return "Draft (저비용)";
  if (q === "hq") return "HQ (고품질)";
  return "Standard (기본)";
}

function CollapseSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-gray-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {hint && (
            <span className="ml-2 text-xs text-gray-400">{hint}</span>
          )}
        </div>
        <svg
          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t border-gray-100 px-3 pb-3 pt-2">{children}</div>}
    </div>
  );
}

export default function AdvancedSettingsPanel({
  profile,
  isOpen,
  onToggle,
}: AdvancedSettingsPanelProps) {
  const [form, setForm] = useState<ProfilePatch>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [presets, setPresets] = useState<IllustrationStylePreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch presets on mount
  useEffect(() => {
    fetch("/api/illustrations/style-presets")
      .then((r) => r.json())
      .then((data) => {
        if (data.presets) setPresets(data.presets);
      })
      .catch(() => {});
  }, []);

  if (!profile) return null;

  const merged = { ...profile, ...form };

  function update<K extends keyof ProfilePatch>(key: K, value: ProfilePatch[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const handleAnalyzeStyle = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지는 5MB 이하만 가능합니다.");
      return;
    }

    setAnalyzing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/illustrations/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });

      const data = await res.json();
      if (data.analysis) {
        setForm((prev) => ({
          ...prev,
          styleName: data.analysis.styleName,
          palette: data.analysis.palette,
          lineStyle: data.analysis.lineStyle,
          mood: data.analysis.mood,
          characterGuide: data.analysis.characterGuide,
          styleEnabled: true,
        }));
      } else {
        alert(data.error?.message || "스타일 분석에 실패했습니다.");
      }
    } catch {
      alert("스타일 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    setPresetLoading(true);
    try {
      const currentMerged = { ...profile, ...form };
      const res = await fetch("/api/illustrations/style-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName.trim(),
          styleName: currentMerged.styleName,
          palette: currentMerged.palette,
          lineStyle: currentMerged.lineStyle,
          mood: currentMerged.mood,
          characterGuide: currentMerged.characterGuide,
          negativePrompt: currentMerged.negativePrompt,
          defaultQuality: currentMerged.defaultQuality,
          aspectRatio: currentMerged.aspectRatio,
        }),
      });
      const data = await res.json();
      if (data.preset) {
        setPresets((prev) => [data.preset, ...prev].slice(0, 10));
        setPresetName("");
        setShowSaveInput(false);
      }
    } catch {
      // silent
    } finally {
      setPresetLoading(false);
    }
  };

  const handleLoadPreset = (preset: IllustrationStylePreset) => {
    setForm((prev) => ({
      ...prev,
      styleName: preset.styleName,
      palette: preset.palette,
      lineStyle: preset.lineStyle,
      mood: preset.mood,
      characterGuide: preset.characterGuide,
      negativePrompt: preset.negativePrompt,
      defaultQuality: preset.defaultQuality,
      aspectRatio: preset.aspectRatio,
    }));
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      await fetch(`/api/illustrations/style-presets/${presetId}`, { method: "DELETE" });
      setPresets((prev) => prev.filter((p) => p.presetId !== presetId));
    } catch {
      // silent
    }
  };

  async function handleSave() {
    if (Object.keys(form).length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/illustrations/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(data.error?.message || "저장 실패");
      }
      setMessage("스타일 설정이 저장되었습니다.");
      setForm({});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div>
          <span className="text-sm font-bold text-gray-700">스타일 고급 설정</span>
          <p className="mt-0.5 text-xs text-gray-400">주제는 메인 입력창 · 여기서는 어떻게 그릴지(스타일)만 설정하세요</p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-4">
          {/* Info banner */}
          <div className="rounded-lg bg-violet-50 px-4 py-3">
            <p className="text-xs font-medium text-violet-700">
              여기서 설정한 스타일이 지문 일러스트 생성에 직접 적용됩니다.
            </p>
            <p className="mt-0.5 text-[11px] text-violet-500">
              레퍼런스 이미지에서 스타일을 추출하거나 직접 입력하세요. 지문 내용은 AI가 자동 분석합니다.
            </p>
          </div>

          {/* 스타일 설정 적용 토글 */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={merged.styleEnabled ?? false}
              onChange={(e) => setForm((prev) => ({ ...prev, styleEnabled: e.target.checked }))}
              className="h-5 w-5 rounded accent-orange-500"
            />
            <div>
              <span className="font-medium text-gray-900">스타일 설정 적용</span>
              <p className="text-xs text-gray-500">켜면 아래 설정이 삽화 생성에 반영됩니다</p>
            </div>
          </label>

          {/* Style Analysis from Image */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAnalyzeStyle(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-orange-600 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 transition-colors"
            >
              {analyzing ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                  스타일 분석 중...
                </>
              ) : (
                "이미지에서 스타일 추출"
              )}
            </button>
            <p className="mt-1 text-[10px] text-gray-400 text-center">
              참조 이미지를 업로드하면 AI가 스타일을 자동 분석하여 아래 설정을 채웁니다
            </p>
          </div>

          {/* Style Presets */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">저장된 스타일 프리셋</span>
              <button
                type="button"
                onClick={() => setShowSaveInput((prev) => !prev)}
                className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
              >
                {showSaveInput ? "취소" : "+ 현재 설정 저장"}
              </button>
            </div>

            {showSaveInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="프리셋 이름 (예: 웹툰 스타일)"
                  maxLength={40}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSavePreset();
                  }}
                />
                <button
                  type="button"
                  onClick={handleSavePreset}
                  disabled={presetLoading || !presetName.trim()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  저장
                </button>
              </div>
            )}

            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <div key={preset.presetId} className="group flex items-center gap-1 bg-gray-100 rounded-lg px-2.5 py-1.5 hover:bg-orange-50 transition-colors">
                    <button
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="text-xs text-gray-700 group-hover:text-orange-600 font-medium"
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(preset.presetId)}
                      className="text-[10px] text-gray-400 hover:text-red-500 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`space-y-4${merged.styleEnabled ? "" : " opacity-50 pointer-events-none"}`}>
          {/* 기본 품질/비율 — 상단 노출 */}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">기본 품질</span>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                value={merged.defaultQuality}
                onChange={(e) =>
                  update("defaultQuality", e.target.value as IllustrationQuality)
                }
              >
                <option value="draft">{qualityLabel("draft")}</option>
                <option value="standard">{qualityLabel("standard")}</option>
                <option value="hq">{qualityLabel("hq")}</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">기본 비율</span>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                value={merged.aspectRatio}
                onChange={(e) =>
                  update("aspectRatio", e.target.value as IllustrationAspectRatio)
                }
              >
                <option value="4:3">4:3</option>
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
              </select>
            </label>
          </div>

          {/* 스타일 슬롯 — 메인 노출 */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">스타일 이름</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                value={merged.styleName}
                maxLength={60}
                onChange={(e) => update("styleName", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">팔레트</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                value={merged.palette}
                maxLength={60}
                onChange={(e) => update("palette", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">선 스타일</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                value={merged.lineStyle}
                maxLength={60}
                onChange={(e) => update("lineStyle", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold text-gray-700">분위기</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
                value={merged.mood}
                maxLength={60}
                onChange={(e) => update("mood", e.target.value)}
              />
            </label>
          </div>

          {/* 캐릭터/그림체 가이드 — 메인 영역 */}
          <label className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">캐릭터/그림체 가이드</span>
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">핵심 설정</span>
            </div>
            <p className="text-xs text-gray-500">
              그림체 특징을 입력하세요. 장면/인물을 직접 지정하지 말고 스타일만 기술합니다.
            </p>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={merged.characterGuide}
              maxLength={300}
              placeholder="예: cute chibi characters, big expressive eyes, soft rounded lines, pastel color fills"
              onChange={(e) => update("characterGuide", e.target.value)}
            />
          </label>

          {/* 네거티브 프롬프트 — 접힘 처리 */}
          <CollapseSection label="네거티브 프롬프트" hint="전문가 옵션">
            <textarea
              className="min-h-[64px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={merged.negativePrompt ?? ""}
              maxLength={400}
              placeholder="예: blurry, watermark, text, realistic photo"
              onChange={(e) => update("negativePrompt", e.target.value)}
            />
          </CollapseSection>


          </div>

          <div className="flex items-center justify-between pt-1">
            {message && (
              <p className="text-xs text-emerald-600">{message}</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Object.keys(form).length === 0}
              className="ml-auto rounded-xl bg-gray-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
