"use client";

import type { CreditEntry } from "@gyoanmaker/shared/types";

interface CreditDetailsSectionProps {
  flash: CreditEntry[];
  pro: CreditEntry[];
}

function formatDateKr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isExpiringSoon(expiresAt: string): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function CreditRow({
  type,
  entry,
}: {
  type: "flash" | "pro";
  entry: CreditEntry;
}) {
  const expiring = isExpiringSoon(entry.expiresAt);
  const label = type === "flash" ? "Speed" : "Precision";

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
            type === "flash"
              ? "bg-amber-100 text-amber-700"
              : "bg-violet-100 text-violet-700"
          }`}
        >
          {label}
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {entry.remaining}건
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>구매 {formatDateKr(entry.purchasedAt)}</span>
        <span className={expiring ? "font-semibold text-red-600" : ""}>
          {expiring ? "만료 임박 " : "만료 "}
          {formatDateKr(entry.expiresAt)}
        </span>
      </div>
    </div>
  );
}

export default function CreditDetailsSection({
  flash,
  pro,
}: CreditDetailsSectionProps) {
  const entries = [
    ...flash.map((e) => ({ type: "flash" as const, entry: e })),
    ...pro.map((e) => ({ type: "pro" as const, entry: e })),
  ].sort(
    (a, b) =>
      new Date(a.entry.purchasedAt).getTime() -
      new Date(b.entry.purchasedAt).getTime()
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
        Credit Details
      </h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">
          구매한 크레딧이 없습니다
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {entries.map((item, idx) => (
            <CreditRow
              key={`${item.type}-${item.entry.purchasedAt}-${idx}`}
              type={item.type}
              entry={item.entry}
            />
          ))}
        </div>
      )}
    </section>
  );
}
