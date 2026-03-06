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
        <h3 className="text-lg font-bold text-gray-900">Mock 결제</h3>
        <p className="mt-2 text-sm text-gray-600">{title}</p>
        <p className="mt-3 text-2xl font-extrabold text-gray-900">
          ₩{amount.toLocaleString("ko-KR")}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          실제 결제는 발생하지 않으며 테스트 성공 응답만 반환됩니다.
        </p>

        <div className="mt-6 flex items-center gap-2 justify-end">
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600"
            onClick={onClose}
            disabled={processing}
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? "결제 중..." : "결제 진행"}
          </button>
        </div>
      </div>
    </div>
  );
}
