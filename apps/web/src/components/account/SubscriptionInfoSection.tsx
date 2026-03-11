"use client";

import type { PlanId } from "@gyoanmaker/shared/plans";

interface SubscriptionInfoSectionProps {
  tier: PlanId;
  currentPeriodStartAt: string;
  currentPeriodEndAt: string | null;
  createdAt: string | null;
}

function formatDateKr(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isExpired(endAt: string | null): boolean {
  if (!endAt) return false;
  return new Date(endAt) < new Date();
}

export default function SubscriptionInfoSection({
  tier,
  currentPeriodStartAt,
  currentPeriodEndAt,
  createdAt,
}: SubscriptionInfoSectionProps) {
  const isFree = tier === "free";
  const expired = !isFree && isExpired(currentPeriodEndAt);
  const rows: { label: string; value: string; badge?: { text: string; color: string } }[] = [];

  if (!isFree) {
    rows.push({
      label: "이용 기간",
      value: `${formatDateKr(currentPeriodStartAt)} ~ ${formatDateKr(currentPeriodEndAt)}`,
      ...(expired
        ? { badge: { text: "만료됨", color: "bg-red-100 text-red-700" } }
        : {}),
    });
  }

  rows.push({
    label: "쿼터 리셋",
    value: isFree ? "매월 1일 초기화" : "결제일 기준 30일 후 초기화",
  });

  if (createdAt) {
    rows.push({
      label: "계정 생성일",
      value: formatDateKr(createdAt),
    });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
        이용권 정보
      </h3>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="font-medium text-gray-900 flex items-center gap-2">
              {row.value}
              {row.badge && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.badge.color}`}
                >
                  {row.badge.text}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
