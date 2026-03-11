"use client";

import { useEffect, useRef } from "react";
import {
  TOP_UP_PACKAGES,
  type TopUpCreditType,
} from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

const CREDIT_TYPE_LABELS: Record<TopUpCreditType, string> = {
  flash: "속도",
  pro: "정밀",
  illustration: "일러스트",
};

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
}

const ILLUSTRATION_PACKAGES = TOP_UP_PACKAGES.filter((pkg) => pkg.type === "illustration");
const LESSON_PACKAGES = TOP_UP_PACKAGES.filter((pkg) => pkg.type === "pro" || pkg.type === "flash");

export default function TopUpModal({
  open,
  onClose,
}: TopUpModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    const handleClose = () => onClose();
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-lg rounded-2xl border-none bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">크레딧 충전</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-400">90일 유효 · VAT 별도</p>

        {/* Illustration packs */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            일러스트 추가 팩
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ILLUSTRATION_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  ₩{pkg.price.toLocaleString()}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <TossPaymentButton
                    type="topup"
                    packageId={pkg.id}
                    checkoutFlow="widget"
                    label="위젯 결제"
                    className="w-full"
                  />
                  <TossPaymentButton
                    type="topup"
                    packageId={pkg.id}
                    checkoutFlow="paylink"
                    label="페이링크 결제 (준비중)"
                    disabled
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lesson credit packs */}
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            교안 크레딧 팩
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LESSON_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
              >
                <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {CREDIT_TYPE_LABELS[pkg.type]} {pkg.amount}회
                </p>
                <p className="mt-1 text-base font-bold text-gray-900">
                  ₩{pkg.price.toLocaleString()}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <TossPaymentButton
                    type="topup"
                    packageId={pkg.id}
                    checkoutFlow="widget"
                    label="위젯 결제"
                    className="w-full"
                  />
                  <TossPaymentButton
                    type="topup"
                    packageId={pkg.id}
                    checkoutFlow="paylink"
                    label="페이링크 결제 (준비중)"
                    disabled
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}
