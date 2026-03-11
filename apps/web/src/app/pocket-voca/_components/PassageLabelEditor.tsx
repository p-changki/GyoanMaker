"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePocketVocaStore } from "../_hooks/usePocketVocaStore";
import { usePocketVocaGeneration } from "../_hooks/usePocketVocaGeneration";
import { parseHandoutSection } from "@/lib/parseHandout";
import GenerateConfirmModal from "./GenerateConfirmModal";

interface HandoutDetail {
  id: string;
  title: string;
  model: "flash" | "pro";
  sections: Record<string, string>; // raw text per passageId
}

async function fetchHandout(id: string): Promise<HandoutDetail> {
  const res = await fetch(`/api/handouts/${id}`);
  if (!res.ok) throw new Error("교안을 불러오지 못했습니다.");
  return res.json() as Promise<HandoutDetail>;
}

export default function PassageLabelEditor() {
  const selectedHandoutId = usePocketVocaStore((s) => s.selectedHandoutId);
  const passageLabels = usePocketVocaStore((s) => s.passageLabels);
  const isGenerating = usePocketVocaStore((s) => s.isGenerating);
  const setPassageLabel = usePocketVocaStore((s) => s.setPassageLabel);
  const setStep = usePocketVocaStore((s) => s.setStep);
  const { generate } = usePocketVocaGeneration();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    data: handout,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["handout-detail", selectedHandoutId],
    queryFn: () => fetchHandout(selectedHandoutId!),
    enabled: Boolean(selectedHandoutId),
  });

  // Parse raw text sections → extract sentences
  const parsedPassages = useMemo(() => {
    if (!handout?.sections) return [];
    return Object.entries(handout.sections)
      .map(([passageId, rawText]) => {
        const section = parseHandoutSection(passageId, rawText);
        return { passageId, section };
      })
      .filter(({ section }) => section.isParsed && section.sentences.length > 0)
      .sort((a, b) => a.passageId.localeCompare(b.passageId));
  }, [handout]);

  const handleConfirmedGenerate = async () => {
    setShowConfirm(false);
    if (!handout || parsedPassages.length === 0) return;
    setError(null);

    const passages = parsedPassages.map(({ passageId, section }) => ({
      passageId,
      sentences: section.sentences.map((s) => s.en),
    }));

    try {
      await generate({
        passages,
        model: handout.model ?? "pro",
        handoutId: handout.id,
        handoutTitle: handout.title,
        passageLabels,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 중 오류가 발생했습니다.");
    }
  };

  const handleGenerateClick = () => {
    if (!handout || parsedPassages.length === 0) return;
    setShowConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        교안 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (isError || !handout) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        교안을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 2</p>
        <h2 className="text-2xl font-bold text-gray-900">라벨 설정 및 생성</h2>
        <p className="text-sm text-gray-500">
          각 지문에 표시될 라벨을 설정한 후 생성하세요.
        </p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">{handout.title}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold uppercase">
            {handout.model ?? "pro"}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {parsedPassages.length} 지문 · 모델은 교안 설정에 따라 자동 연동됩니다.
        </p>
      </div>

      {parsedPassages.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          분석된 지문이 없습니다. 교안을 먼저 생성해 주세요.
        </div>
      )}

      {parsedPassages.length > 0 && (
        <ul className="space-y-3">
          {parsedPassages.map(({ passageId, section }) => {
            const defaultLabel = passageId.replace(/^P0*/, "P");
            const label = passageLabels[passageId] ?? defaultLabel;

            return (
              <li
                key={passageId}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
              >
                <span className="shrink-0 rounded-full bg-[#EDE7F6] px-2.5 py-1 text-xs font-bold text-[#5E35B1]">
                  {passageId}
                </span>
                <input
                  type="text"
                  value={label}
                  maxLength={30}
                  onChange={(e) => setPassageLabel(passageId, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#5E35B1] focus:outline-none focus:ring-1 focus:ring-[#5E35B1]"
                  placeholder="예: 15강 4번"
                />
                <span className="shrink-0 text-xs text-gray-400">
                  {section.sentences.length}문장
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-gray-300"
        >
          이전
        </button>
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating || parsedPassages.length === 0}
          className="rounded-lg bg-[#5E35B1] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              생성 중...
            </>
          ) : (
            "생성하기"
          )}
        </button>
      </div>
      {showConfirm && handout && (
        <GenerateConfirmModal
          passageCount={parsedPassages.length}
          model={handout.model ?? "pro"}
          onConfirm={handleConfirmedGenerate}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </section>
  );
}
