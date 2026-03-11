"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePocketVocaStore } from "../_hooks/usePocketVocaStore";
import HandoutSelector from "./HandoutSelector";
import PassageLabelEditor from "./PassageLabelEditor";
import PocketVocaPreview from "./PocketVocaPreview";
import SavedPocketVocaList from "./SavedPocketVocaList";

const STEPS = [
  { id: 1 as const, label: "교안 선택" },
  { id: 2 as const, label: "생성" },
  { id: 3 as const, label: "미리보기" },
];

export default function PocketVocaOrchestrator() {
  const searchParams = useSearchParams();
  const step = usePocketVocaStore((s) => s.step);
  const selectedHandoutId = usePocketVocaStore((s) => s.selectedHandoutId);
  const generatedData = usePocketVocaStore((s) => s.generatedData);
  const setStep = usePocketVocaStore((s) => s.setStep);
  const selectHandout = usePocketVocaStore((s) => s.selectHandout);

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
  const canGoStep3 = Boolean(generatedData);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">포켓보카</h1>
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
      {step === 2 && <PassageLabelEditor />}
      {step === 3 && <PocketVocaPreview />}

      {step !== 3 && <SavedPocketVocaList />}
    </div>
  );
}
