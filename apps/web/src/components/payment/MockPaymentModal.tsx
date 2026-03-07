"use client";

interface MockPaymentModalProps {
  open: boolean;
  title: string;
  amount: number;
  processing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function MockPaymentModal({
  open,
  title,
  amount,
  processing,
  onConfirm,
  onClose,
}: MockPaymentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 px-4 py-8">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Mock Payment</h3>
        <p className="mt-2 text-sm text-gray-600">{title}</p>
        <p className="mt-3 text-2xl font-extrabold text-gray-900">
          ₩{amount.toLocaleString()}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          No actual payment will be processed. This is a test response only.
        </p>

        <div className="mt-6 flex items-center gap-2 justify-end">
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? "Processing..." : "Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}
