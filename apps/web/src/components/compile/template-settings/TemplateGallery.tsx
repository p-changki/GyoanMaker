"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTemplateSettingsStore, extractSettings } from "@/stores/useTemplateSettingsStore";
import type { SavedTemplate } from "@gyoanmaker/shared/types";
import { THEME_PRESETS, FONT_FAMILY_MAP } from "@gyoanmaker/shared/types";
import SaveTemplateModal from "./SaveTemplateModal";

async function fetchTemplates(): Promise<SavedTemplate[]> {
  const res = await fetch("/api/templates");
  if (!res.ok) throw new Error("템플릿 목록 로드 실패");
  const json = await res.json() as { data: SavedTemplate[] };
  return json.data;
}

async function saveTemplate(name: string, settings: import("@gyoanmaker/shared/types").TemplateSettings): Promise<SavedTemplate> {
  const res = await fetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, settings }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error: { message: string } }).error?.message ?? "저장 실패");
  }
  return (json as { data: SavedTemplate }).data;
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("삭제 실패");
}

export default function TemplateGallery() {
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: fetchTemplates,
  });

  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const settings = extractSettings(useTemplateSettingsStore.getState());
      return saveTemplate(name, settings);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setShowModal(false);
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : "저장 실패");
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const loadSettings = useTemplateSettingsStore((s) => s.loadSettings);

  function applyTemplate(template: SavedTemplate) {
    loadSettings(template.settings);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          템플릿 갤러리
        </p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-[10px] font-bold text-[#5E35B1] hover:text-[#4527A0] transition-colors"
        >
          + 현재 설정 저장
        </button>
      </div>

      {errorMsg && (
        <p className="text-[10px] text-red-500">{errorMsg}</p>
      )}

      {isLoading ? (
        <p className="text-[10px] text-gray-400">로딩 중...</p>
      ) : templates.length === 0 ? (
        <p className="text-[10px] text-gray-400">저장된 템플릿이 없습니다.</p>
      ) : (
        <div className="space-y-1">
          {templates.map((t) => {
            const previewColors = THEME_PRESETS[t.settings.themePreset] ?? THEME_PRESETS.purple;
            const fontLabel = FONT_FAMILY_MAP[t.settings.fontFamily]?.label ?? "프리텐다드";
            return (
            <div
              key={t.id}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white border border-gray-100"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                <div
                  className="w-4 h-4 rounded-full shrink-0 border border-gray-200"
                  style={{ backgroundColor: previewColors.primary }}
                  title={previewColors.label}
                />
                <div className="min-w-0">
                  <span className="text-xs font-medium text-gray-700 block truncate">
                    {t.name}
                  </span>
                  <span className="text-[9px] text-gray-400">{fontLabel}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-[10px] font-bold text-[#5E35B1] hover:text-[#4527A0] px-1.5 py-0.5 rounded hover:bg-[#5E35B1]/5 transition-colors"
                >
                  적용
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(t.id)}
                  disabled={deleteMutation.isPending}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <SaveTemplateModal
          onConfirm={async (name) => { await saveMutation.mutateAsync(name); }}
          onClose={() => setShowModal(false)}
          isSaving={saveMutation.isPending}
        />
      )}
    </div>
  );
}
