"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gyoan_trial_guide_dismissed";

interface FreeTrialGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    title: "교안 생성 체험",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Generate</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "blue",
    items: [
      "Speed 모드로 2~3개 지문을 빠르게 생성해보세요 (10~20초)",
      "Precision 모드로 1~2개 지문을 정밀 생성해서 품질 차이를 비교해보세요 (30초~2분)",
      "다양한 난이도(고급/기초)를 조합해보세요",
    ],
    tip: "난이도(고급/기초)는 쿼타에 영향 없어요! 자유롭게 바꿔보세요.",
  },
  {
    title: "일러스트 & 컨셉 체험",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Illustration</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "amber",
    items: [
      "기본 제공 프리셋 컨셉으로 교안에 일러스트를 적용해보세요",
      "일러스트 테스트로 나만의 컨셉을 미리보기 해보세요 (하루 3회)",
      "마음에 드는 스타일을 샘플로 저장해서 재사용하세요",
    ],
    tip: "일러스트 크레딧 5건으로 교안에 일러스트를 넣어보세요!",
  },
  {
    title: "편집 & PDF 내보내기",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Edit and Export</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "emerald",
    items: [
      "컴파일 페이지에서 교안을 인라인 편집하세요",
      "색상, 레이아웃, 어휘 배열을 자유롭게 커스터마이징하세요",
      "완성된 교안을 PDF로 내보내서 바로 수업에 활용하세요",
    ],
    tip: "PDF 내보내기는 무제한! 마음껏 다운로드하세요.",
  },
  {
    title: "무료 쿼타 안내",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <title>Quota</title>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "violet",
    items: [],
    tip: "",
  },
] as const;

const COLOR_MAP: Record<string, { text: string; iconBg: string; tipBg: string; tipBorder: string }> = {
  blue: { text: "text-blue-700", iconBg: "bg-blue-100", tipBg: "bg-blue-50", tipBorder: "border-blue-200" },
  amber: { text: "text-amber-700", iconBg: "bg-amber-100", tipBg: "bg-amber-50", tipBorder: "border-amber-200" },
  emerald: { text: "text-emerald-700", iconBg: "bg-emerald-100", tipBg: "bg-emerald-50", tipBorder: "border-emerald-200" },
  violet: { text: "text-violet-700", iconBg: "bg-violet-100", tipBg: "bg-violet-50", tipBorder: "border-violet-200" },
};

function QuotaOverview() {
  const quotaItems = [
    { label: "Speed 생성", value: "10회 / 월", icon: "⚡" },
    { label: "Precision 생성", value: "5회 / 월", icon: "🎯" },
    { label: "일러스트 크레딧", value: "5건 / 월", icon: "🖼" },
    { label: "일러스트 테스트", value: "3회 / 일", icon: "🎨" },
    { label: "저장 공간", value: "3개", icon: "💾" },
    { label: "PDF 내보내기", value: "무제한", icon: "📄" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Free 요금제에서 제공되는 기능을 모두 체험해보세요!
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {quotaItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5"
          >
            <span className="text-base">{item.icon}</span>
            <div>
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <p className="text-sm font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
        <p className="text-xs text-violet-700 leading-relaxed">
          더 많은 교안이 필요하다면 유료 요금제를 확인해보세요. Basic 요금제부터 무제한 저장과 더 많은 생성 쿼타를 제공합니다.
        </p>
      </div>
    </div>
  );
}

export default function FreeTrialGuideModal({
  isOpen,
  onClose,
}: FreeTrialGuideModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      startTransition(() => {
        setStep(0);
      });
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
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose();
  };

  const isLastStep = step === STEPS.length - 1;
  const currentStep = STEPS[step];
  const colors = COLOR_MAP[currentStep.color];

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="backdrop:bg-black/40 backdrop:backdrop-blur-sm bg-transparent p-4 m-auto max-w-lg w-full"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${colors.iconBg} flex items-center justify-center ${colors.text}`}>
              {currentStep.icon}
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Free 체험 가이드
            </h2>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>Close</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.color}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Step {step + 1} / {STEPS.length}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 min-h-[260px]">
          <h3 className={`text-lg font-bold ${colors.text} mb-3`}>
            {currentStep.title}
          </h3>

          {isLastStep ? (
            <QuotaOverview />
          ) : (
            <div className="space-y-3">
              <ul className="space-y-2">
                {currentStep.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.iconBg} shrink-0`} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>

              {currentStep.tip && (
                <div className={`rounded-xl border ${colors.tipBorder} ${colors.tipBg} p-3`}>
                  <p className={`text-xs ${colors.text} leading-relaxed`}>
                    <span className="font-bold">TIP</span> — {currentStep.tip}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-xs text-gray-500">다시 보지 않기</span>
          </label>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
            )}

            {isLastStep ? (
              <div className="flex flex-1 gap-2">
                <Link
                  href="/pricing"
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center text-violet-700 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-colors"
                >
                  요금제 보기
                </Link>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                >
                  시작하기
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                다음
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

/** Check if the free trial guide should auto-show */
export function shouldShowFreeTrialGuide(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}
