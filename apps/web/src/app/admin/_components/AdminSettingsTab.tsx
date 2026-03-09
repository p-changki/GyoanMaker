"use client";

import { useCallback, useEffect, useState } from "react";

interface IllustrationPreset {
  presetId: string;
  prompt: string;
  revisedPrompt: string;
  imageUrl: string;
  model: string;
  quality: string;
  aspectRatio: string;
  createdAt: string;
}

export default function AdminSettingsTab() {
  const [presets, setPresets] = useState<IllustrationPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Add preset form
  const [sampleId, setSampleId] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/illustration-presets");
      if (!res.ok) throw new Error("프리셋 불러오기 실패");
      const data = (await res.json()) as { presets: IllustrationPreset[] };
      setPresets(data.presets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleAdd = async () => {
    if (!sampleId.trim() || !ownerEmail.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/illustration-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId: sampleId.trim(), ownerEmail: ownerEmail.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "프리셋 추가 실패");
      }
      setSampleId("");
      setOwnerEmail("");
      await fetchPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "프리셋 추가 실패");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (presetId: string) => {
    setDeleting(presetId);
    try {
      const res = await fetch(`/api/admin/illustration-presets?presetId=${encodeURIComponent(presetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("프리셋 삭제 실패");
      await fetchPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "프리셋 삭제 실패");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Illustration Presets */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">일러스트 프리셋</h2>
          <p className="text-sm text-gray-500 mt-1">
            모든 사용자에게 기본 컨셉으로 제공되는 일러스트 프리셋을 관리합니다.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add Preset Form */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-gray-700">사용자 샘플에서 프리셋 추가</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="소유자 이메일"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <input
              type="text"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              placeholder="샘플 ID"
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !sampleId.trim() || !ownerEmail.trim()}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? "추가 중..." : "프리셋 추가"}
          </button>
        </div>

        {/* Preset List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            프리셋 로딩 중...
          </div>
        ) : presets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">설정된 프리셋 없음</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <div
                key={preset.presetId}
                className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm"
              >
                {preset.imageUrl && (
                  <div className="aspect-square bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.imageUrl}
                      alt="Preset preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <p className="text-xs text-gray-500 truncate" title={preset.prompt}>
                    {preset.prompt}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{preset.model}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{preset.quality}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{preset.aspectRatio}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400">
                      {new Date(preset.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(preset.presetId)}
                      disabled={deleting === preset.presetId}
                      className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      {deleting === preset.presetId ? "..." : "삭제"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
