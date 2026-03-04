"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  splitTextBlockIntoPassages,
  passagesToCards,
  cardsToPassages,
  passagesToTextBlock,
} from "@/lib/parsePassages";
import {
  InputMode,
  PassageInput as PassageInputType,
  GenerationMode,
  OutputOptionState,
} from "@/lib/types";
import PassageInput from "@/components/PassageInput";
import PassageCard from "@/components/PassageCard";

const SESSION_STORAGE_KEY = "gyoanmaker:input";

export default function GeneratePage() {
  const router = useRouter();

  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [textBlock, setTextBlock] = useState("");
  const [cards, setCards] = useState<PassageInputType[]>([]);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("basic");
  const [options, setOptions] = useState<OutputOptionState>({
    copyBlock: true,
    pdf: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passageCount = useMemo(() => {
    if (inputMode === "text") {
      return splitTextBlockIntoPassages(textBlock).length;
    }
    return cards.filter((c) => c.text.trim().length > 0).length;
  }, [inputMode, textBlock, cards]);

  const isSubmitDisabled = passageCount === 0 || passageCount > 20;

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

  const handleSubmit = () => {
    if (isSubmitDisabled || isSubmitting) return;
    setIsSubmitting(true);

    const finalPassages =
      inputMode === "text"
        ? splitTextBlockIntoPassages(textBlock)
        : cardsToPassages(cards);

    const payload = {
      inputMode,
      passages: finalPassages,
      options,
      generationMode,
      timestamp: new Date().toISOString(),
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    router.push("/results");
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200/60 rounded-[2rem] p-8 shadow-premium space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
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
            <h3 className="text-lg font-bold text-gray-900">생성 모드</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center p-4 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer group transition-all hover:border-blue-200">
              <input
                type="radio"
                name="generationMode"
                checked={generationMode === "basic"}
                onChange={() => setGenerationMode("basic")}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-4">
                <span className="block text-sm font-bold text-gray-900">
                  기본 모드
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  표준적인 교안 구성 요소를 생성합니다.
                </span>
              </div>
            </label>
            <label className="flex items-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60">
              <input
                type="radio"
                name="generationMode"
                disabled
                className="w-5 h-5 text-gray-300 border-gray-300"
              />
              <div className="ml-4">
                <span className="block text-sm font-bold text-gray-400">
                  심화 모드 (준비 중)
                </span>
                <span className="block text-xs text-gray-400 mt-0.5">
                  더 상세한 분석과 추가 학습 자료를 포함합니다.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200/60 rounded-[2rem] p-8 shadow-premium space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-indigo-600"
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
            <h3 className="text-lg font-bold text-gray-900">출력 옵션</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-80">
              <input
                type="checkbox"
                checked={true}
                disabled
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="ml-4">
                <span className="block text-sm font-bold text-gray-700">
                  복사용 텍스트 블록
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  결과 페이지에서 즉시 복사 가능합니다.
                </span>
              </div>
            </label>
            <label className="flex items-center p-4 rounded-xl border border-gray-200 cursor-pointer group transition-all hover:border-blue-200 hover:bg-blue-50/10">
              <input
                type="checkbox"
                checked={options.pdf}
                onChange={(e) =>
                  setOptions({ ...options, pdf: e.target.checked })
                }
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="ml-4">
                <span className="block text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  PDF 다운로드
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  인쇄 및 보관용 PDF 파일을 생성합니다.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

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
      </div>
    </div>
  );
}
