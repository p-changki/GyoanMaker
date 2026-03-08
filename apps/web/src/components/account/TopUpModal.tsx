"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TOP_UP_PACKAGES,
  MODEL_DISPLAY_NAMES,
  type TopUpCreditType,
} from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TopUpCreditType;
}

export default function TopUpModal({
  open,
  onClose,
  defaultType = "flash",
}: TopUpModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeType, setActiveType] = useState<TopUpCreditType>(defaultType);

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

  const filteredPackages = useMemo(
    () => TOP_UP_PACKAGES.filter((pkg) => pkg.type === activeType),
    [activeType]
  );

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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 flex gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
            {(["flash", "pro", "illustration"] as TopUpCreditType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  activeType === type
                    ? "bg-white text-[#5E35B1] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {MODEL_DISPLAY_NAMES[type]}
              </button>
            ))}
          </div>

          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-900">{pkg.label}</p>
              <p className="mt-1 text-sm text-gray-600">
                {MODEL_DISPLAY_NAMES[pkg.type]} {pkg.amount} 크레딧
              </p>
              <p className="mt-1 text-base font-bold text-gray-900">
                ₩{pkg.price.toLocaleString()}
              </p>
              <div className="mt-3">
                <TossPaymentButton
                  type="topup"
                  packageId={pkg.id}
                  label="충전하기"
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
