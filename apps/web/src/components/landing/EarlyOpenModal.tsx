"use client";

import { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gyoan_early_open_dismissed";

export default function EarlyOpenModal() {
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)
  );

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🎉</span>
          <h2 className="text-lg font-bold text-gray-900">얼리 오픈 안내</h2>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          현재 서비스 초기 오픈 단계로, 결제는{" "}
          <span className="font-semibold text-gray-800">무통장입금</span>으로
          운영되고 있습니다.
          <br />
          서비스 안정화에 따라 카드결제 등을 순차적으로 도입할 예정입니다.
        </p>

        {/* Steps */}
        <div className="bg-gray-50 rounded-xl px-5 py-4 mb-5 text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-gray-800 mb-2">결제 방법</p>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold shrink-0">1</span>
            <span>상단 <span className="font-semibold">요금제</span> 메뉴 클릭</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold shrink-0">2</span>
            <span>원하는 플랜 선택</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold shrink-0">3</span>
            <span>무통장입금으로 결제 완료</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          세금계산서 · 현금영수증 발급 가능 · 입금 접수 및 완료 시 이메일 안내
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href="/pricing"
            onClick={handleDismiss}
            className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            요금제 보러가기 →
          </Link>
          <Link
            href="/board/lPEq5GYnhyuwaKitnioR"
            onClick={handleDismiss}
            className="w-full text-center text-xs text-indigo-500 hover:text-indigo-700 py-1.5 transition-colors"
          >
            요금제 안내 및 환불 정책 보기
          </Link>
          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
