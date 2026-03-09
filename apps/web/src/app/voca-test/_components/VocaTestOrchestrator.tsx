"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import HandoutSelector from "./HandoutSelector";
import QuestionSelector from "./QuestionSelector";
import TestConfigPanel from "./TestConfigPanel";
import TestPreview from "./TestPreview";
import { useVocaTestStore } from "../_hooks/useVocaTestStore";

const STEPS = [
  { id: 1 as const, label: "교안 선택" },
  { id: 2 as const, label: "문제/설정" },
  { id: 3 as const, label: "미리보기" },
];

export default function VocaTestOrchestrator() {
  const searchParams = useSearchParams();
  const step = useVocaTestStore((state) => state.step);
  const selectedHandoutId = useVocaTestStore((state) => state.selectedHandoutId);
  const questionPool = useVocaTestStore((state) => state.questionPool);
  const selectedQuestionIds = useVocaTestStore((state) => state.selectedQuestionIds);
  const setStep = useVocaTestStore((state) => state.setStep);
  const selectHandout = useVocaTestStore((state) => state.selectHandout);

  const handoutIdFromUrl = searchParams.get("handoutId");
  const appliedRef = useRef(false);

  useEffect(() => {
    if (handoutIdFromUrl && !appliedRef.current) {
      appliedRef.current = true;
      selectHandout(handoutIdFromUrl);
      setStep(2);
    }
  }, [handoutIdFromUrl, selectHandout, setStep]);

  const canGoStep2 = Boolean(selectedHandoutId);
  const canGoStep3 = questionPool.length > 0 && selectedQuestionIds.size > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">보카 테스트</h1>
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

      {step === 1 && <HandoutSelector />}

      {step === 2 && (
        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <QuestionSelector />
            <TestConfigPanel />
          </div>
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

      {step === 3 && selectedHandoutId && (
        <TestPreview />
      )}
    </div>
  );
}
