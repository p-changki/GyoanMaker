"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CreditEntry } from "@gyoanmaker/shared/types";
import CreditDetailsSection from "./CreditDetailsSection";
import PaymentHistorySection from "./PaymentHistorySection";
import UsageHistorySection from "./UsageHistorySection";

type TabKey = "payment" | "usage" | "credits";

interface Tab {
  key: TabKey;
  label: string;
}

const TABS: Tab[] = [
  { key: "payment", label: "결제 내역" },
  { key: "usage", label: "사용 내역" },
  { key: "credits", label: "크레딧 상세" },
];

interface HistoryTabsProps {
  flash: CreditEntry[];
  pro: CreditEntry[];
  illustration: CreditEntry[];
}

export default function HistoryTabs({
  flash,
  pro,
  illustration,
}: HistoryTabsProps) {
  const [active, setActive] = useState<TabKey>("payment");

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "flex-1 py-3 text-center text-xs font-bold tracking-wide transition-colors",
              active === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {active === "payment" && <PaymentHistorySection embedded />}
        {active === "usage" && <UsageHistorySection embedded />}
        {active === "credits" && (
          <CreditDetailsSection
            flash={flash}
            pro={pro}
            illustration={illustration}
            embedded
          />
        )}
      </div>
    </section>
  );
}
