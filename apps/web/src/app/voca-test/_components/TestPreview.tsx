"use client";

import { useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import AnswerSheet from "./AnswerSheet";
import TestSheet from "./TestSheet";
import { seededShuffle, reshuffleOptionsForRandomMode } from "../_hooks/useQuestionGenerator";
import { useTestExport } from "../_hooks/useTestExport";
import { useVocaTestStore } from "../_hooks/useVocaTestStore";

export default function TestPreview() {
  const { toast } = useToast();
  const config = useVocaTestStore((state) => state.config);
  const questionPool = useVocaTestStore((state) => state.questionPool);
  const selectedQuestionIds = useVocaTestStore((state) => state.selectedQuestionIds);
  const shuffleQuestions = useVocaTestStore((state) => state.shuffleQuestions);
  const setStep = useVocaTestStore((state) => state.setStep);

  const { isExporting, exportPDF } = useTestExport();

  const shuffleSeed = useMemo(() => {
    if (!shuffleQuestions) return 0;

    let hash = 0x9e3779b9;
    for (const question of questionPool) {
      if (!selectedQuestionIds.has(question.id)) continue;
      for (const char of question.id) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
      }
    }
    return hash || 1;
  }, [shuffleQuestions, questionPool, selectedQuestionIds]);

  const selectedQuestions = useMemo(() => {
    const filtered = questionPool.filter((question) => selectedQuestionIds.has(question.id));
    if (shuffleQuestions) {
      const reordered = seededShuffle(filtered, shuffleSeed);
      return reshuffleOptionsForRandomMode(reordered, shuffleSeed + 9999);
    }
    return filtered;
  }, [questionPool, selectedQuestionIds, shuffleQuestions, shuffleSeed]);

  const pagedQuestions = useMemo(() => {
    const pages: typeof selectedQuestions[] = [];
    for (let i = 0; i < selectedQuestions.length; i += 10) {
      pages.push(selectedQuestions.slice(i, i + 10));
    }
    return pages;
  }, [selectedQuestions]);

  const handleExport = async () => {
    if (selectedQuestions.length === 0) {
      toast("선택된 문제가 없습니다.", "error");
      return;
    }

    try {
      const fileName = `${config.testCode || "voca-test"}_${new Date()
        .toISOString()
        .slice(0, 10)}`;
      await exportPDF(fileName);
      toast("PDF 저장이 완료되었습니다.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF 저장에 실패했습니다.";
      toast(message, "error");
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 3</p>
        <h2 className="text-2xl font-bold text-gray-900">시험지 미리보기</h2>
        <p className="text-sm text-gray-500">
          {selectedQuestions.length}문제 선택됨 · 시험지 {pagedQuestions.length}페이지
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || selectedQuestions.length === 0}
          className="rounded-lg bg-[#5E35B1] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4527A0] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isExporting ? "PDF 생성 중..." : "PDF 저장"}
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600 transition hover:border-gray-300"
        >
          수정하기
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-gray-100 p-4">
        {selectedQuestions.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-sm text-gray-500">
            선택된 문제가 없습니다. Step 2로 돌아가 문제를 선택해 주세요.
          </div>
        ) : (
          <div className="mx-auto flex w-fit min-w-full flex-col items-center gap-6">
            {pagedQuestions.map((pageQuestions, pageIndex) => (
              <TestSheet
                key={`test-${pageIndex}`}
                config={config}
                questions={pageQuestions}
                pageIndex={pageIndex}
              />
            ))}
            <AnswerSheet config={config} questions={selectedQuestions} />
          </div>
        )}
      </div>
    </section>
  );
}
