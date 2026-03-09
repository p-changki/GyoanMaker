"use client";

import type { PlanId } from "@gyoanmaker/shared/plans";

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

interface SubscriptionInfoSectionProps {
  tier: PlanId;
  currentPeriodStartAt: string;
  currentPeriodEndAt: string | null;
  paymentMethod: string | null;
  planPendingTier: PlanId | null;
  createdAt: string | null;
  monthKeyKst: string;
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

function computePeriodEnd(startAt: string, endAt: string | null): string | null {
  if (endAt) return endAt;
  const startMs = new Date(startAt).getTime();
  if (Number.isNaN(startMs)) return null;
  return new Date(startMs + PERIOD_MS).toISOString();
}

function formatPaymentMethod(method: string | null): string {
  if (method === "toss") return "토스페이먼츠";
  if (method === "mock") return "테스트 결제";
  return "-";
}

export default function SubscriptionInfoSection({
  tier,
  currentPeriodStartAt,
  currentPeriodEndAt,
  paymentMethod,
  planPendingTier,
  createdAt,
}: SubscriptionInfoSectionProps) {
  const isFree = tier === "free";
  const periodEnd = isFree ? null : computePeriodEnd(currentPeriodStartAt, currentPeriodEndAt);
  const rows: { label: string; value: string; badge?: { text: string; color: string } }[] = [];

  if (!isFree) {
    rows.push({
      label: "구독 기간",
      value: `${formatDateKr(currentPeriodStartAt)} ~ ${formatDateKr(periodEnd)}`,
    });
    rows.push({
      label: "다음 결제일",
      value: periodEnd ? formatDateKr(periodEnd) : "-",
    });
    rows.push({
      label: "결제 수단",
      value: formatPaymentMethod(paymentMethod),
    });
    rows.push({
      label: "쿼터 리셋",
      value: "다음 결제일에 초기화",
    });
  } else {
    rows.push({
      label: "쿼터 리셋",
      value: "매월 1일 초기화",
    });
  }

  if (planPendingTier) {
    rows.push({
      label: "플랜 변경 예약",
      value: "",
      badge: {
        text: `→ ${planPendingTier.toUpperCase()} 전환 예정`,
        color: "bg-blue-100 text-blue-800",
      },
    });
  }

  if (createdAt) {
    rows.push({
      label: "계정 생성일",
      value: formatDateKr(createdAt),
    });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
        구독 정보
      </h3>
      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="font-medium text-gray-900">
              {row.badge ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.badge.color}`}
                >
                  {row.badge.text}
                </span>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
