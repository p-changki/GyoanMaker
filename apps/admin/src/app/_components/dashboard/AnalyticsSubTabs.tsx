"use client";

import type { AnalyticsSubTab } from "./analytics.constants";

const TABS: { key: AnalyticsSubTab; label: string }[] = [
  { key: "revenue", label: "매출 분석" },
  { key: "usage", label: "사용량 분석" },
  { key: "users", label: "유저 분석" },
];

interface AnalyticsSubTabsProps {
  activeTab: AnalyticsSubTab;
  onChange: (tab: AnalyticsSubTab) => void;
}

export default function AnalyticsSubTabs({ activeTab, onChange }: AnalyticsSubTabsProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === tab.key
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
