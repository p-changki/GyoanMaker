"use client";

import { useEffect, useState } from "react";

interface UsageSummaryData {
  totalRequests: number;
  totalPassages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export default function UsageDashboard() {
  const [daily, setDaily] = useState<UsageSummaryData | null>(null);
  const [monthly, setMonthly] = useState<UsageSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/usage?period=daily").then((r) => r.json()),
      fetch("/api/usage?period=monthly").then((r) => r.json()),
    ])
      .then(([d, m]) => {
        setDaily(d);
        setMonthly(m);
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

  const cards = [
    {
      label: "Today Requests",
      value: daily?.totalRequests ?? 0,
      unit: "",
      sub: `${daily?.totalPassages ?? 0} passages`,
    },
    {
      label: "Today Tokens",
      value: ((daily?.totalTokens ?? 0) / 1000).toFixed(1),
      unit: "K",
      sub: `$${(daily?.estimatedCostUsd ?? 0).toFixed(4)}`,
    },
    {
      label: "Monthly Requests",
      value: monthly?.totalRequests ?? 0,
      unit: "",
      sub: `${monthly?.totalPassages ?? 0} passages`,
    },
    {
      label: "Monthly Tokens",
      value: ((monthly?.totalTokens ?? 0) / 1000).toFixed(1),
      unit: "K",
      sub: `$${(monthly?.estimatedCostUsd ?? 0).toFixed(4)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {card.label}
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {card.value}
            <span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
