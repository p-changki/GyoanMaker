"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface BillingKeySuccessClientProps {
  authKey: string | null;
  customerKey: string | null;
}

interface RegisterErrorPayload {
  error?: {
    message?: string;
  };
}

export default function BillingKeySuccessClient({
  authKey,
  customerKey,
}: BillingKeySuccessClientProps) {
  const router = useRouter();
  const requestedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvalidParams = !authKey || !customerKey;

  useEffect(() => {
    if (requestedRef.current || hasInvalidParams) {
      return;
    }

    requestedRef.current = true;

    const registerKey = async () => {
      const res = await fetch("/api/billing/billing-key/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authKey, customerKey }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as RegisterErrorPayload | null;
        throw new Error(
          payload?.error?.message ?? "빌링키 등록에 실패했습니다."
        );
      }

      router.replace("/account");
    };

    registerKey().catch((err) => {
      const message =
        err instanceof Error ? err.message : "빌링키 등록에 실패했습니다.";
      setError(message);
    });
  }, [authKey, customerKey, hasInvalidParams, router]);

  if (hasInvalidParams) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          카드 등록 실패
        </h1>
        <p className="mt-3 text-sm text-red-600">
          빌링키 파라미터가 유효하지 않습니다.
        </p>
        <div className="mt-6">
          <Link
            href="/account"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            내 계정으로
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          카드 등록 실패
        </h1>
        <p className="mt-3 text-sm text-red-600">{error}</p>
        <div className="mt-6">
          <Link
            href="/account"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            내 계정으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        카드 등록 중...
      </h1>
      <p className="mt-3 text-sm text-gray-500">
        결제 수단을 등록하는 동안 잠시 기다려 주세요.
      </p>
    </main>
  );
}
