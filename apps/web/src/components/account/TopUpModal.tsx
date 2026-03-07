"use client";

import { useEffect, useRef } from "react";
import { TOP_UP_PACKAGES } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "@/components/billing/TossPaymentButton";

interface TopUpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TopUpModal({ open, onClose }: TopUpModalProps) {
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
          <h2 className="text-lg font-bold text-gray-900">Top Up Credits</h2>
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
          {TOP_UP_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="text-sm font-semibold text-gray-900">{pkg.id}</p>
              <p className="mt-1 text-sm text-gray-600">
                {pkg.type.toUpperCase()} {pkg.amount} credits
              </p>
              <p className="mt-1 text-base font-bold text-gray-900">
                ₩{pkg.price.toLocaleString()}
              </p>
              <div className="mt-3">
                <TossPaymentButton
                  type="topup"
                  packageId={pkg.id}
                  label="Top Up"
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
