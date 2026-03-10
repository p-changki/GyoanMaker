"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { HandoutSection, WorkbookData } from "@gyoanmaker/shared/types";
import { parseHandoutSection } from "@/lib/parseHandout";
import { useWorkbookStore } from "@/stores/useWorkbookStore";
import WorkbookConfigPanel from "./WorkbookConfigPanel";
import WorkbookPreview from "./WorkbookPreview";
import { useWorkbookGenerator } from "../_hooks/useWorkbookGenerator";

interface HandoutMeta {
  id: string;
  title: string;
  passageCount: number;
  createdAt: string;
}

interface HandoutDetail {
  id: string;
  title: string;
  sections: Record<string, string>;
  workbook?: WorkbookData | null;
}

const STEPS = [
  { id: 1 as const, label: "교안 선택" },
  { id: 2 as const, label: "설정/생성" },
  { id: 3 as const, label: "미리보기" },
];

async function fetchHandouts(): Promise<HandoutMeta[]> {
  const res = await fetch("/api/handouts");
  if (!res.ok) {
    throw new Error("Failed to load handouts.");
  }
  const data = (await res.json()) as { handouts?: HandoutMeta[] };
  return data.handouts ?? [];
}

async function fetchHandoutDetail(handoutId: string): Promise<HandoutDetail> {
  const res = await fetch(`/api/handouts/${handoutId}`);
  if (!res.ok) {
    throw new Error("Failed to load handout detail.");
  }
  return (await res.json()) as HandoutDetail;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WorkbookOrchestrator() {
  const searchParams = useSearchParams();
  const handoutIdFromUrl = searchParams.get("handoutId");
  const [step, setStep] = useState<1 | 2 | 3>(() => (handoutIdFromUrl ? 2 : 1));
  const [selectedHandoutId, setSelectedHandoutId] = useState<string | null>(() => handoutIdFromUrl);
  const selectedHandoutRef = useRef<string | null>(null);

  const workbookData = useWorkbookStore((state) => state.workbookData);
  const setWorkbookData = useWorkbookStore((state) => state.setWorkbookData);
  const setSelectedModel = useWorkbookStore((state) => state.setSelectedModel);
  const setGenerateError = useWorkbookStore((state) => state.setGenerateError);
  const resetWorkbook = useWorkbookStore((state) => state.resetWorkbook);
  const { generate } = useWorkbookGenerator();

  const {
    data: handouts = [],
    isLoading: isHandoutsLoading,
    isError: isHandoutsError,
  } = useQuery({
    queryKey: ["handouts"],
    queryFn: fetchHandouts,
  });

  const {
    data: handoutDetail,
    isLoading: isHandoutDetailLoading,
    isError: isHandoutDetailError,
  } = useQuery({
    queryKey: ["workbook-handout", selectedHandoutId],
    enabled: Boolean(selectedHandoutId),
    queryFn: () => fetchHandoutDetail(selectedHandoutId as string),
  });

  useEffect(() => {
    if (!selectedHandoutId || !handoutDetail) return;
    if (selectedHandoutRef.current === selectedHandoutId) return;

    selectedHandoutRef.current = selectedHandoutId;
    if (handoutDetail.workbook) {
      setWorkbookData(handoutDetail.workbook);
      setSelectedModel(handoutDetail.workbook.model);
      queueMicrotask(() => {
        setStep(3);
      });
    }
  }, [handoutDetail, selectedHandoutId, setWorkbookData, setSelectedModel]);

  const parsedSections = useMemo<Record<string, HandoutSection>>(() => {
    if (!handoutDetail?.sections) return {};

    return Object.fromEntries(
      Object.entries(handoutDetail.sections)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([passageId, rawText]) => [passageId, parseHandoutSection(passageId, rawText)])
    );
  }, [handoutDetail]);

  const handleSelectHandout = (handoutId: string) => {
    setSelectedHandoutId(handoutId);
    selectedHandoutRef.current = null;
    resetWorkbook();
    setGenerateError(null);
  };

  const handleGenerate = async () => {
    const ok = await generate(parsedSections);
    if (ok) {
      setStep(3);
    }
  };

  const canGoStep2 = Boolean(selectedHandoutId);
  const canGoStep3 = Boolean(workbookData);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">워크북 생성기</h1>
        <nav className="flex flex-wrap gap-2">
          {STEPS.map((item) => {
            const isActive = step === item.id;
            const isDisabled =
              (item.id === 2 && !canGoStep2) || (item.id === 3 && !canGoStep3);

            return (
              <button
                key={item.id}
                type="button"
                disabled={isDisabled}
                onClick={() => setStep(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? "bg-[#5E35B1] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {step === 1 && (
        <section className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-gray-500">Step 1</p>
            <h2 className="text-2xl font-bold text-gray-900">교안 선택</h2>
            <p className="text-sm text-gray-500">워크북을 생성할 교안을 선택하세요.</p>
          </header>

          {isHandoutsLoading && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              교안 목록을 불러오는 중입니다.
            </div>
          )}

          {isHandoutsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              교안 목록을 불러오지 못했습니다.
            </div>
          )}

          {!isHandoutsLoading && !isHandoutsError && handouts.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              저장된 교안이 없습니다. 먼저 교안을 생성해 주세요.
            </div>
          )}

          {!isHandoutsLoading && !isHandoutsError && handouts.length > 0 && (
            <ul className="space-y-3">
              {handouts.map((handout) => {
                const checked = selectedHandoutId === handout.id;
                return (
                  <li key={handout.id}>
                    <label
                      className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                        checked
                          ? "border-[#5E35B1] bg-[#F3E8FF]"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="workbook-handout"
                        className="mt-1 h-4 w-4 accent-[#5E35B1]"
                        checked={checked}
                        onChange={() => handleSelectHandout(handout.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {handout.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {handout.passageCount} 지문 · {formatDate(handout.createdAt)}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canGoStep2}
              className="rounded-lg bg-[#5E35B1] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              다음
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          {isHandoutDetailLoading && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
              선택한 교안을 불러오는 중입니다.
            </div>
          )}

          {isHandoutDetailError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              교안 정보를 불러오지 못했습니다.
            </div>
          )}

          {!isHandoutDetailLoading && !isHandoutDetailError && selectedHandoutId && (
            <WorkbookConfigPanel handoutTitle={handoutDetail?.title} onGenerate={handleGenerate} />
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
              onClick={() => setStep(3)}
              disabled={!canGoStep3}
              className="rounded-lg bg-[#5E35B1] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              미리보기
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        selectedHandoutId ? (
          <WorkbookPreview
            handoutId={selectedHandoutId}
            parsedSections={parsedSections}
            onBackToConfig={() => setStep(2)}
          />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
            선택된 교안이 없습니다. Step 1에서 교안을 선택해 주세요.
          </div>
        )
      )}
    </div>
  );
}
