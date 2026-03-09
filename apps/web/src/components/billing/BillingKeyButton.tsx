"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { cn } from "@/lib/cn";
import { createCustomerKey } from "@/lib/toss-utils";

interface BillingKeyButtonProps {
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function BillingKeyButton({
  label = "카드 등록",
  className,
  disabled,
}: BillingKeyButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isLoading || disabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 키가 설정되지 않았습니다.");
      }

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: createCustomerKey(session?.user?.email),
      });

      const origin = window.location.origin;
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${origin}/billing/billing-key/success`,
        failUrl: `${origin}/billing/billing-key/fail`,
        customerEmail: session?.user?.email ?? undefined,
        customerName: session?.user?.name ?? undefined,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "카드 등록을 시작하지 못했습니다.";
      setError(message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors",
          "hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300",
          className
        )}
      >
        {isLoading ? "이동 중..." : label}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
