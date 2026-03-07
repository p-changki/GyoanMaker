"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import BillingKeyButton from "@/components/billing/BillingKeyButton";

interface BillingKeyPublicResponse {
  ok: boolean;
  card: {
    cardCompany: string;
    cardNumber: string;
    createdAt: string;
  } | null;
}

async function fetchBillingKey(): Promise<BillingKeyPublicResponse> {
  const res = await fetch("/api/billing/billing-key");
  if (!res.ok) {
    throw new Error("Failed to fetch billing key.");
  }
  return res.json();
}

export default function BillingKeySection() {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-key"],
    queryFn: fetchBillingKey,
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/billing/billing-key", {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } })?.error?.message ??
            "Failed to delete card."
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["billing-key"] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete card.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700">Payment Method</h3>
        <div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />
      </section>
    );
  }

  const card = data?.card ?? null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold text-gray-700">Payment Method</h3>

      {card ? (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
              CARD
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {card.cardCompany}
              </p>
              <p className="text-xs text-gray-500">{card.cardNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="mb-3 text-xs text-gray-500">
            Register a card for automatic subscription renewal.
          </p>
          <BillingKeyButton label="Register Card" />
        </div>
      )}

      {deleteError ? (
        <p className="mt-2 text-xs text-red-600">{deleteError}</p>
      ) : null}
    </section>
  );
}
