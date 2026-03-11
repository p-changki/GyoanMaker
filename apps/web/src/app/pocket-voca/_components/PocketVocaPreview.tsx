"use client";

import { useState } from "react";
import { usePocketVocaStore } from "../_hooks/usePocketVocaStore";
import { usePocketVocaExport } from "../_hooks/usePocketVocaExport";
import PocketVocaSheet from "./PocketVocaSheet";

export default function PocketVocaPreview() {
  const generatedData = usePocketVocaStore((s) => s.generatedData);
  const config = usePocketVocaStore((s) => s.config);
  const updateConfig = usePocketVocaStore((s) => s.updateConfig);
  const setStep = usePocketVocaStore((s) => s.setStep);
  const { isExporting, exportPDF } = usePocketVocaExport();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  if (!generatedData) return null;

  const handleExportPDF = async () => {
    const title = config.sheetTitle || "포켓보카";
    await exportPDF(`${title}.pdf`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/pocket-vocas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: config.sheetTitle || "포켓보카",
          passageCount: generatedData.passages.length,
          model: generatedData.model,
          data: generatedData,
          config,
          handoutId: generatedData.handoutId,
          handoutTitle: generatedData.handoutTitle,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? "저장에 실패했습니다.");
      }

      const result = (await res.json()) as { id: string };
      setSavedId(result.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 3</p>
        <h2 className="text-2xl font-bold text-gray-900">미리보기 및 내보내기</h2>
      </header>

      {/* Config panel */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-700">설정</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">시트 코드</span>
            <input
              type="text"
              value={config.sheetCode}
              onChange={(e) => updateConfig({ sheetCode: e.target.value })}
              maxLength={10}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              placeholder="PV1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">헤더 제목</span>
            <input
              type="text"
              value={config.sheetTitle}
              onChange={(e) => updateConfig({ sheetTitle: e.target.value })}
              maxLength={30}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              placeholder="예: 포켓보카"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">섹션 라벨</span>
            <input
              type="text"
              value={config.sectionLabel}
              onChange={(e) => updateConfig({ sectionLabel: e.target.value })}
              maxLength={30}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              placeholder="예: 핵심어휘"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">범위 설명</span>
            <input
              type="text"
              value={config.rangeDescription}
              onChange={(e) => updateConfig({ rangeDescription: e.target.value })}
              maxLength={50}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              placeholder="예: 15강 4~6번"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">선생님 이름</span>
            <input
              type="text"
              value={config.teacherName}
              onChange={(e) => updateConfig({ teacherName: e.target.value })}
              maxLength={20}
              className="rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
              placeholder="홍길동"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-gray-300"
          >
            이전
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || Boolean(savedId)}
            className="rounded-lg border border-[#5E35B1] px-4 py-2 text-sm font-bold text-[#5E35B1] transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savedId ? "저장됨 ✓" : isSaving ? "저장 중..." : "저장"}
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="rounded-lg bg-[#5E35B1] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                내보내는 중...
              </>
            ) : (
              "PDF 내보내기"
            )}
          </button>
        </div>

        {saveError && (
          <p className="text-xs text-red-600">{saveError}</p>
        )}
      </div>

      {/* Sheet preview */}
      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-4">
        <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-6">
          <PocketVocaSheet data={generatedData} config={config} />
        </div>
      </div>
    </section>
  );
}
