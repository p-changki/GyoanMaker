"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { cn } from "@/lib/cn";
import { createCustomerKey } from "@/lib/toss-utils";
import { type PlanId, type TopUpPackageId } from "@gyoanmaker/shared/plans";

interface CheckoutInitResponse {
  orderId: string;
  amount: number;
  orderName: string;
}

interface CheckoutErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface TossPaymentButtonProps {
  type: "subscription" | "topup";
  planId?: PlanId;
  packageId?: TopUpPackageId;
  label: string;
  className?: string;
  disabled?: boolean;
}

function resolveErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeError = payload as CheckoutErrorResponse;
  if (maybeError.error?.message) {
    return maybeError.error.message;
  }

  return fallback;
}

function isCheckoutInitResponse(payload: unknown): payload is CheckoutInitResponse {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const record = payload as Record<string, unknown>;
  return (
    typeof record.orderId === "string" &&
    typeof record.orderName === "string" &&
    typeof record.amount === "number"
  );
}

export default function TossPaymentButton({
  type,
  planId,
  packageId,
  label,
  className,
  disabled,
}: TossPaymentButtonProps) {
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
      const initRes = await fetch("/api/billing/checkout/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          planId,
          packageId,
        }),
      });

      const initPayload = (await initRes.json().catch(() => null)) as
        | CheckoutInitResponse
        | CheckoutErrorResponse
        | null;

      if (!initRes.ok || !isCheckoutInitResponse(initPayload)) {
        throw new Error(
          resolveErrorMessage(initPayload, "결제 초기화에 실패했습니다.")
        );
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 키가 설정되지 않았습니다.");
      }

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: createCustomerKey(session?.user?.email),
      });

      const origin = window.location.origin;
      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: initPayload.amount,
        },
        orderId: initPayload.orderId,
        orderName: initPayload.orderName,
        successUrl: `${origin}/billing/success`,
        failUrl: `${origin}/billing/fail`,
        customerEmail: session?.user?.email ?? undefined,
        customerName: session?.user?.name ?? undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "결제를 시작하지 못했습니다.";
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
