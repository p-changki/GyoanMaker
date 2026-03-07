"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

interface BillingFailClientProps {
  code: string;
  message: string;
  orderId: string | null;
}

export default function BillingFailClient({
  code,
  message,
  orderId,
}: BillingFailClientProps) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (cancelledRef.current || !orderId) {
      return;
    }

    cancelledRef.current = true;

    // Mark the pending order as failed so it doesn't stay as "pending" forever
    fetch("/api/billing/cancel-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason: `Payment failed: ${code}` }),
    }).catch(() => {
      // Best-effort cleanup — webhook will handle it if this fails
    });
  }, [orderId, code]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      <p className="mt-1 text-xs text-gray-400">Error code: {code}</p>

      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/account"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Account
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
        >
          View Pricing
        </Link>
      </div>
    </main>
  );
}
