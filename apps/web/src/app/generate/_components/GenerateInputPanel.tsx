"use client";

import PassageCard from "@/components/PassageCard";
import PassageInput from "@/components/PassageInput";
import { InputMode, PassageInput as PassageInputType } from "@gyoanmaker/shared/types";

interface GenerateInputPanelProps {
  inputMode: InputMode;
  textBlock: string;
  cards: PassageInputType[];
  passageCount: number;
  onTextBlockChange: (value: string) => void;
  onToggleMode: (mode: InputMode) => void;
  onAddCard: () => void;
  onUpdateCard: (index: number, text: string) => void;
  onRemoveCard: (index: number) => void;
}

export default function GenerateInputPanel({
  inputMode,
  textBlock,
  cards,
  passageCount,
  onTextBlockChange,
  onToggleMode,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
}: GenerateInputPanelProps) {
  return (
    <>
      <div className="flex justify-center">
        <div className="bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-2xl flex shadow-inner">
          <button
            type="button"
            onClick={() => onToggleMode("text")}
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
            onClick={() => onToggleMode("cards")}
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
            onChange={onTextBlockChange}
            passageCount={passageCount}
          />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">지문 목록</h2>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  passageCount > 20 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"
                }`}
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
                  onChange={(text) => onUpdateCard(index, text)}
                  onRemove={() => onRemoveCard(index)}
                />
              ))}
              {cards.length < 20 && (
                <button
                  type="button"
                  onClick={onAddCard}
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
    </>
  );
}
