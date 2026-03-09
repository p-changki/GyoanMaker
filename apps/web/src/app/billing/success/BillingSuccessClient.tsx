"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface BillingSuccessClientProps {
  paymentKey: string | null;
  orderId: string | null;
  amount: number;
}

interface ConfirmErrorPayload {
  error?: {
    message?: string;
  };
}

export default function BillingSuccessClient({
  paymentKey,
  orderId,
  amount,
}: BillingSuccessClientProps) {
  const router = useRouter();
  const requestedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvalidParams =
    !paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0;

  useEffect(() => {
    if (requestedRef.current || hasInvalidParams) {
      return;
    }

    requestedRef.current = true;

    const confirmPayment = async () => {
      const res = await fetch("/api/billing/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as ConfirmErrorPayload | null;
        throw new Error(payload?.error?.message ?? "결제 승인에 실패했습니다.");
      }

      router.replace("/account");
    };

    confirmPayment().catch((err) => {
      const message = err instanceof Error ? err.message : "결제 승인에 실패했습니다.";
      setError(message);
    });
  }, [amount, hasInvalidParams, orderId, paymentKey, router]);

  if (hasInvalidParams) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">결제 확인 실패</h1>
        <p className="mt-3 text-sm text-red-600">결제 확인 정보가 올바르지 않습니다.</p>
        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/account"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            계정으로 이동
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            요금제 보기
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">결제 확인 실패</h1>
        <p className="mt-3 text-sm text-red-600">{error}</p>
        <div className="mt-6 flex items-center gap-2">
          <Link
            href="/account"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            계정으로 이동
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            요금제 보기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">결제 승인 중...</h1>
      <p className="mt-3 text-sm text-gray-500">플랜을 활성화하는 동안 잠시 기다려 주세요.</p>
    </main>
  );
}
