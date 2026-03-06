"use client";

import { useEffect, useRef } from "react";

interface GenerateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerateGuideModal({
  isOpen,
  onClose,
}: GenerateGuideModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-sm bg-transparent p-4 m-auto max-w-2xl w-full"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">생성 옵션 가이드</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>닫기</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 난이도 섹션 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>난이도</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                난이도 — 교안의 어휘 수준과 내용 깊이
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <p className="text-sm font-bold text-emerald-700">
                  상위권 (Advanced)
                </p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>수능/TEPS 1등급 대비 학생 대상</li>
                  <li>B2~C1 수준의 고급 어휘 사용</li>
                  <li>유의어 3개, 반의어 2개 제공</li>
                  <li>심화 패러프레이징 주제문/요약문</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <p className="text-sm font-bold text-emerald-700">
                  기초 (Basic)
                </p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>내신 중하위권 (2~4등급) 학생 대상</li>
                  <li>A2~B1 수준의 친숙한 어휘 사용</li>
                  <li>유의어 2개, 반의어 1개 제공</li>
                  <li>쉬운 표현으로 이해 중심 해석</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 생성 모드 섹션 */}
          <section className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>생성 모드</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900">
                생성 모드 — AI 모델의 속도와 정확도
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-sm font-bold text-blue-700">
                  정밀 모드 (Pro)
                </p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>Gemini 2.5 Pro 모델 사용</li>
                  <li>지문당 약 30~60초 소요</li>
                  <li>높은 정확도와 일관된 품질</li>
                  <li>중요한 교안 제작 시 추천</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <p className="text-sm font-bold text-blue-700">
                  빠른 모드 (Flash)
                </p>
                <ul className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <li>Gemini 2.5 Flash 모델 사용</li>
                  <li>지문당 약 5~10초 소요</li>
                  <li>빠른 속도, 대량 생성에 적합</li>
                  <li>초안 확인이나 시간이 급할 때 추천</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 추천 조합 */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900">추천 조합</h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <span className="text-base mt-0.5">🎯</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    상위권 + 정밀 모드
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    수능 대비 정교한 교안이 필요할 때. 가장 높은 품질.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <span className="text-base mt-0.5">⚡</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    기초 + 빠른 모드
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    수업 전 빠르게 기초 교안을 만들 때. 속도와 효율 중심.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <span className="text-base mt-0.5">📝</span>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    기초 + 정밀 모드
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    중하위권 학생에게 정확한 기초 교안을 제공할 때.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </dialog>
  );
}
