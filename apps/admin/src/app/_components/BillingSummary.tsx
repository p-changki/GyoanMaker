"use client";

import { useEffect, useState } from "react";

interface BillingSummaryData {
  monthlyRevenue: number;
  monthlyOrderCount: number;
  pendingCount: number;
  paidNotAppliedCount: number;
  failedCount: number;
}

export default function BillingSummary() {
  const [data, setData] = useState<BillingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/summary")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d) => {
        if (typeof d.monthlyRevenue === "number") {
          setData(d);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: "이번달 매출",
      value: `₩${data.monthlyRevenue.toLocaleString()}`,
      sub: `${data.monthlyOrderCount}건`,
      alert: false,
    },
    {
      label: "결제 대기",
      value: data.pendingCount,
      sub: "이번달 미완료",
      alert: false,
    },
    {
      label: "결제 미적용",
      value: data.paidNotAppliedCount,
      sub: "재처리 필요",
      alert: data.paidNotAppliedCount > 0,
    },
    {
      label: "실패 / 취소",
      value: data.failedCount,
      sub: "이번달 기준",
      alert: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white border rounded-xl p-4 shadow-sm ${
            card.alert
              ? "border-red-300 bg-red-50"
              : "border-gray-200/60"
          }`}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {card.label}
          </p>
          <p
            className={`text-xl font-bold mt-1 ${
              card.alert ? "text-red-600" : "text-gray-900"
            }`}
          >
            {card.value}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
