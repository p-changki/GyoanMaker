"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { parseHandoutSection } from "@/lib/parseHandout";
import { useLectureSlideStore } from "../_hooks/useLectureSlideStore";
import HandoutSelector from "./HandoutSelector";
import SlideSettings from "./SlideSettings";
import SlidePreview from "./SlidePreview";

const STEPS = [
  { id: 1 as const, label: "교안 선택" },
  { id: 2 as const, label: "슬라이드 설정" },
  { id: 3 as const, label: "미리보기" },
];

async function fetchHandout(id: string): Promise<Record<string, string>> {
  const res = await fetch(`/api/handouts/${id}`);
  if (!res.ok) throw new Error("교안을 불러오지 못했습니다.");
  const data = (await res.json()) as { sections?: Record<string, string> };
  return data.sections ?? {};
}

export default function LectureSlideOrchestrator() {
  const searchParams = useSearchParams();
  const step = useLectureSlideStore((s) => s.step);
  const selectedHandoutId = useLectureSlideStore((s) => s.selectedHandoutId);
  const sections = useLectureSlideStore((s) => s.sections);
  const setStep = useLectureSlideStore((s) => s.setStep);
  const selectHandout = useLectureSlideStore((s) => s.selectHandout);
  const setSections = useLectureSlideStore((s) => s.setSections);
  const reset = useLectureSlideStore((s) => s.reset);

  // URL query param: ?handoutId=xxx
  const handoutIdFromUrl = searchParams.get("handoutId");
  const appliedRef = useRef(false);
  useEffect(() => {
    if (handoutIdFromUrl && !appliedRef.current) {
      appliedRef.current = true;
      selectHandout(handoutIdFromUrl, "");
      setStep(2);
    }
  }, [handoutIdFromUrl, selectHandout, setStep]);

  // Fetch + parse sections when handout is selected
  const { data: rawSections } = useQuery({
    queryKey: ["handout", selectedHandoutId],
    queryFn: () => fetchHandout(selectedHandoutId!),
    enabled: !!selectedHandoutId,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!rawSections) return;
    const parsed = Object.entries(rawSections).map(([passageId, rawText]) =>
      parseHandoutSection(passageId, rawText)
    );
    setSections(parsed);
  }, [rawSections, setSections]);

  const canGoStep2 = Boolean(selectedHandoutId);
  const canGoStep3 = Boolean(sections.length > 0);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">강의 슬라이드</h1>
          {selectedHandoutId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-red-300 hover:text-red-500 transition"
            >
              초기화
            </button>
          )}
        </div>
        <nav className="flex flex-wrap gap-2">
          {STEPS.map((item) => {
            const isActive = step === item.id;
            const isDisabled =
              (item.id === 2 && !canGoStep2) ||
              (item.id === 3 && !canGoStep3);
            return (
              <button
                key={item.id}
                type="button"
                disabled={isDisabled}
                onClick={() => setStep(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {item.id}. {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {step === 1 && <HandoutSelector />}
      {step === 2 && <SlideSettings />}
      {step === 3 && <SlidePreview />}
    </div>
  );
}
