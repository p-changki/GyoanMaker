"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHandoutVocab } from "../_hooks/useHandoutVocab";
import { generateQuestionPool } from "../_hooks/useQuestionGenerator";
import { useVocaTestStore } from "../_hooks/useVocaTestStore";

function seedFromHandoutId(handoutId: string): number {
  return Array.from(handoutId).reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) >>> 0;
  }, 0x9e3779b9);
}

export default function QuestionSelector() {
  const selectedHandoutId = useVocaTestStore((state) => state.selectedHandoutId);
  const questionPool = useVocaTestStore((state) => state.questionPool);
  const selectedQuestionIds = useVocaTestStore((state) => state.selectedQuestionIds);
  const setQuestionPool = useVocaTestStore((state) => state.setQuestionPool);
  const toggleQuestion = useVocaTestStore((state) => state.toggleQuestion);
  const selectAll = useVocaTestStore((state) => state.selectAll);
  const deselectAll = useVocaTestStore((state) => state.deselectAll);
  const selectByPassage = useVocaTestStore((state) => state.selectByPassage);
  const shuffleQuestions = useVocaTestStore((state) => state.shuffleQuestions);
  const toggleShuffle = useVocaTestStore((state) => state.toggleShuffle);

  const lastGeneratedHandoutRef = useRef<string | null>(null);
  const { data, isLoading, isError } = useHandoutVocab(selectedHandoutId);

  const generatedQuestions = useMemo(() => {
    if (!data) return [];
    return generateQuestionPool(
      data.vocabItems,
      data.passageIds,
      seedFromHandoutId(data.handoutId)
    );
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (lastGeneratedHandoutRef.current === data.handoutId) return;

    setQuestionPool(generatedQuestions);
    lastGeneratedHandoutRef.current = data.handoutId;
  }, [data, generatedQuestions, setQuestionPool]);

  const groupedQuestions = useMemo(() => {
    const grouped = new Map<string, typeof questionPool>();
    for (const question of questionPool) {
      const existing = grouped.get(question.sourcePassageId);
      if (existing) {
        existing.push(question);
      } else {
        grouped.set(question.sourcePassageId, [question]);
      }
    }

    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [questionPool]);

  const questionNumberMap = useMemo(() => {
    return new Map(questionPool.map((question, index) => [question.id, index + 1]));
  }, [questionPool]);

  const [collapsedPassages, setCollapsedPassages] = useState<Set<string>>(new Set());
  const prevGroupCountRef = useRef(0);

  // Collapse all by default when question groups first load
  if (groupedQuestions.length > 0 && prevGroupCountRef.current === 0) {
    prevGroupCountRef.current = groupedQuestions.length;
    const allIds = new Set(groupedQuestions.map(([id]) => id));
    if (collapsedPassages.size !== allIds.size) {
      setCollapsedPassages(allIds);
    }
  }

  const toggleCollapse = useCallback((passageId: string) => {
    setCollapsedPassages((prev) => {
      const next = new Set(prev);
      if (next.has(passageId)) {
        next.delete(passageId);
      } else {
        next.add(passageId);
      }
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedPassages(new Set(groupedQuestions.map(([id]) => id)));
  }, [groupedQuestions]);

  const expandAll = useCallback(() => {
    setCollapsedPassages(new Set());
  }, []);

  if (!selectedHandoutId) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
        먼저 Step 1에서 교안을 선택해 주세요.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500">Step 2</p>
        <h3 className="text-lg font-bold text-gray-900">문제 선택</h3>
        <p className="text-sm text-gray-500">
          {selectedQuestionIds.size}/{questionPool.length} 문제 선택됨
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={questionPool.length === 0}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전체 선택
        </button>
        <button
          type="button"
          onClick={deselectAll}
          disabled={questionPool.length === 0}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          전체 해제
        </button>
        <button
          type="button"
          onClick={collapsedPassages.size === groupedQuestions.length ? expandAll : collapseAll}
          disabled={groupedQuestions.length === 0}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {collapsedPassages.size === groupedQuestions.length ? "모두 펼치기" : "모두 접기"}
        </button>
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={toggleShuffle}
            className="h-4 w-4 accent-[#5E35B1]"
          />
          <span className="text-xs font-bold text-gray-700">랜덤 출제</span>
        </label>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          지문 어휘를 분석하는 중입니다.
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          문제 생성을 위한 교안 데이터를 불러오지 못했습니다.
        </div>
      )}

      {!isLoading && !isError && questionPool.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          생성 가능한 문제가 없습니다. 유의어/반의어 데이터가 충분한 교안을 선택해 주세요.
        </div>
      )}

      {!isLoading && !isError && groupedQuestions.length > 0 && (
        <div className="space-y-4">
          {groupedQuestions.map(([passageId, questions]) => {
            const selectedCount = questions.filter((q) => selectedQuestionIds.has(q.id)).length;
            const allSelected = selectedCount === questions.length && questions.length > 0;
            const isCollapsed = collapsedPassages.has(passageId);

            return (
              <article
                key={passageId}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(passageId)}
                      className="flex h-5 w-5 items-center justify-center text-gray-400 transition hover:text-gray-600"
                      aria-label={isCollapsed ? "펼치기" : "접기"}
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => selectByPassage(passageId)}
                        className="h-4 w-4 accent-[#5E35B1]"
                      />
                      <span className="text-sm font-semibold text-gray-900">
                        {passageId}
                      </span>
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedCount}/{questions.length}
                  </span>
                </div>

                {!isCollapsed && (
                  <ul className="mt-3 space-y-2">
                    {questions.map((question) => (
                      <li key={question.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.has(question.id)}
                            onChange={() => toggleQuestion(question.id)}
                            className="h-4 w-4 accent-[#5E35B1]"
                          />
                          <span className="text-sm text-gray-700">
                            {questionNumberMap.get(question.id)}. {question.keyword}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
