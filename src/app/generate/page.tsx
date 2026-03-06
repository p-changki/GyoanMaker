"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import GenerateGuideModal from "@/components/GenerateGuideModal";
import DuplicateWarningModal from "@/components/DuplicateWarningModal";
import { hashPassages } from "@/services/cache";
import {
  splitTextBlockIntoPassages,
  passagesToCards,
  cardsToPassages,
  passagesToTextBlock,
  validatePassageLimits,
  type PassageLimitError,
} from "@/lib/parsePassages";
import {
  InputMode,
  PassageInput as PassageInputType,
  ContentLevel,
  ModelTier,
  OutputOptionState,
} from "@/lib/types";
import PassageInput from "@/components/PassageInput";
import PassageCard from "@/components/PassageCard";
import QuotaIndicator from "@/components/QuotaIndicator";

const SESSION_STORAGE_KEY = "gyoanmaker:input";

export default function GeneratePage() {
  const router = useRouter();

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textBlock, setTextBlock] = useState("");
  const [cards, setCards] = useState<PassageInputType[]>([]);
  const [contentLevel, setContentLevel] = useState<ContentLevel>("advanced");
  const [modelTier, setModelTier] = useState<ModelTier>("pro");
  const [options, setOptions] = useState<OutputOptionState>({
    copyBlock: true,
    pdf: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<
    { id: string; title: string; passageCount: number; createdAt: string }[]
  >([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const pendingSubmitRef = useRef(false);
  const handleCloseGuide = useCallback(() => setIsGuideOpen(false), []);

  const finalPassages = useMemo(() => {
    if (inputMode === "text") {
      return splitTextBlockIntoPassages(textBlock);
    }
    return cardsToPassages(cards);
  }, [inputMode, textBlock, cards]);

  const passageCount = finalPassages.length;

  const limitError: PassageLimitError | null = useMemo(
    () => validatePassageLimits(finalPassages),
    [finalPassages]
  );

  const isSubmitDisabled =
    passageCount === 0 || passageCount > 20 || limitError !== null;

  const handleToggleMode = (mode: InputMode) => {
    if (mode === inputMode) return;

    if (mode === "cards") {
      const passages = splitTextBlockIntoPassages(textBlock);
      setCards(passagesToCards(passages));
    } else {
      const passages = cardsToPassages(cards);
      setTextBlock(passagesToTextBlock(passages));
    }
    setInputMode(mode);
  };

  const handleAddCard = () => {
    if (cards.length >= 20) return;
    const newId = `p${String(cards.length + 1).padStart(2, "0")}`;
    setCards([...cards, { id: newId, text: "" }]);
  };

  const handleUpdateCard = (index: number, text: string) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], text };
    setCards(newCards);
  };

  const handleRemoveCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
  };

  const proceedToGenerate = useCallback(() => {
    const payload = {
      inputMode,
      passages: finalPassages,
      options,
      level: contentLevel,
      model: modelTier,
      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    router.push("/results");
  }, [inputMode, finalPassages, options, contentLevel, modelTier, router]);

  const handleSubmit = async () => {
    if (isSubmitDisabled || isSubmitting) return;
    if (pendingSubmitRef.current) return;

    setIsSubmitting(true);
    pendingSubmitRef.current = true;

    try {
      const hash = await hashPassages(finalPassages);
      const res = await fetch("/api/handouts/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputHash: hash }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          duplicates: {
            id: string;
            title: string;
            passageCount: number;
            createdAt: string;
          }[];
        };

        if (data.duplicates.length > 0) {
          setDuplicates(data.duplicates);
          setShowDuplicateModal(true);
          setIsSubmitting(false);
          pendingSubmitRef.current = false;
          return;
        }
      }
    } catch {
      // check failed — proceed anyway
    }

    pendingSubmitRef.current = false;
    proceedToGenerate();
  };

  const handleDuplicateProceed = useCallback(() => {
    setShowDuplicateModal(false);
    setDuplicates([]);
    proceedToGenerate();
  }, [proceedToGenerate]);

  const handleDuplicateClose = useCallback(() => {
    setShowDuplicateModal(false);
    setDuplicates([]);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-10 sm:space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          교안 생성하기
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          영어 지문을 입력하여 맞춤형 교안을 자동으로 생성하세요.{" "}
          <br className="hidden sm:block" />
          교육 전문가를 위한 프리미엄 교안 제작 도구입니다.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex shadow-inner">
          <button
            type="button"
            onClick={() => handleToggleMode("text")}
            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              inputMode === "text"
                ? "bg-white text-blue-600 shadow-md scale-[1.02]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            텍스트 블록
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode("cards")}
            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              inputMode === "cards"
                ? "bg-white text-blue-600 shadow-md scale-[1.02]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            카드 모드
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200/60 rounded-[2rem] p-6 sm:p-10 shadow-premium">
        {inputMode === "text" ? (
          <PassageInput
            value={textBlock}
            onChange={setTextBlock}
            passageCount={passageCount}
          />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">지문 목록</h2>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${passageCount > 20 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"}`}
              >
                감지된 지문: {passageCount} / 20
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cards.map((card, index) => (
                <PassageCard
                  key={card.id}
                  index={index}
                  text={card.text}
                  onChange={(text) => handleUpdateCard(index, text)}
                  onRemove={() => handleRemoveCard(index)}
                />
              ))}
              {cards.length < 20 && (
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:scale-110 transition-all">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <title>지문 추가 아이콘</title>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold">지문 추가</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 난이도 선택 */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>난이도 아이콘</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">난이도</h3>
          </div>
          <div className="space-y-3">
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-emerald-300 ${
                contentLevel === "advanced"
                  ? "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="contentLevel"
                checked={contentLevel === "advanced"}
                onChange={() => setContentLevel("advanced")}
                className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">
                  상위권 (Advanced)
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  수능/TEPS 1등급 대비, B2~C1 고급 어휘
                </span>
              </div>
            </label>
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-emerald-300 ${
                contentLevel === "basic"
                  ? "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="contentLevel"
                checked={contentLevel === "basic"}
                onChange={() => setContentLevel("basic")}
                className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">
                  기초 (Basic)
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  내신 중하위권 대비, A2~B1 쉬운 어휘
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 생성 모드 선택 */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>생성 모드 아이콘</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">생성 모드</h3>
          </div>
          <div className="space-y-3">
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-blue-300 ${
                modelTier === "pro"
                  ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="modelTier"
                checked={modelTier === "pro"}
                onChange={() => setModelTier("pro")}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">
                  정밀 생성
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  높은 정확도, 지문당 30~60초
                </span>
              </div>
            </label>
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-blue-300 ${
                modelTier === "flash"
                  ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="modelTier"
                checked={modelTier === "flash"}
                onChange={() => setModelTier("flash")}
                className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">
                  빠른 생성
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  빠른 생성, 지문당 5~10초
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* 출력 옵션 */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-premium space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-violet-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>출력 옵션 아이콘</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">출력 옵션</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start p-3.5 rounded-xl border border-violet-400 bg-violet-50/40 ring-1 ring-violet-400/30">
              <div className="w-4 h-4 mt-0.5 rounded bg-violet-600 flex items-center justify-center shrink-0">
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <title>체크</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">
                  복사용 텍스트 블록
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  결과 페이지에서 즉시 복사 가능합니다.
                </span>
              </div>
            </div>
            <label
              className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition-all hover:border-violet-300 ${
                options.pdf
                  ? "border-violet-400 bg-violet-50/40 ring-1 ring-violet-400/30"
                  : "border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={options.pdf}
                onChange={(e) =>
                  setOptions({ ...options, pdf: e.target.checked })
                }
                className="w-4 h-4 mt-0.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
              />
              <div className="ml-3 min-w-0">
                <span className="block text-sm font-bold text-gray-900">
                  PDF 다운로드
                </span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                  인쇄 및 보관용 PDF 파일을 생성합니다.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsGuideOpen(true)}
        className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
      >
        <svg
          className="w-4.5 h-4.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>도움말</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-semibold">
          어떤 옵션을 선택해야 할지 모르겠다면?
        </span>
      </button>

      <QuotaIndicator />

      <div className="flex flex-col items-center space-y-6 pt-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled || isSubmitting}
          className={`w-full md:w-80 py-5 rounded-2xl text-xl font-black transition-all shadow-xl ${
            isSubmitDisabled || isSubmitting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.03] active:scale-[0.97] shadow-blue-200"
          }`}
        >
          {isSubmitting ? "생성 중..." : "교안 생성하기"}
        </button>
        {passageCount > 20 && (
          <p className="text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-full">
            지문은 최대 20개까지만 입력 가능합니다.
          </p>
        )}
        {limitError && (
          <p className="text-sm text-red-500 font-bold bg-red-50 px-4 py-2 rounded-xl text-center">
            {limitError.message}
          </p>
        )}
      </div>

      <GenerateGuideModal isOpen={isGuideOpen} onClose={handleCloseGuide} />
      <DuplicateWarningModal
        open={showDuplicateModal}
        duplicates={duplicates}
        onClose={handleDuplicateClose}
        onProceed={handleDuplicateProceed}
      />
    </div>
  );
}
