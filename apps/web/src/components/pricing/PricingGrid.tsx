"use client";

import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";
import PricingCard from "./PricingCard";

interface PricingGridProps {
  currentPlan?: PlanId;
}

const PLAN_ORDER: PlanId[] = ["free", "basic", "standard", "pro"];

export default function PricingGrid({ currentPlan }: PricingGridProps) {
  const router = useRouter();

  const handleSelect = (planId: PlanId) => {
    router.push(`/account?targetPlan=${planId}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((planId, index) => (
          <PricingCard
            key={planId}
            planId={planId}
            plan={PLANS[planId]}
            currentPlan={currentPlan}
            recommended={planId === "basic"}
            onSelect={handleSelect}
            index={index}
            totalPlans={PLAN_ORDER.length}
          />
        ))}
      </div>
      <p className="text-center text-xs text-gray-400">
        사용량은 콘텐츠 난이도와 관계없이 생성 모드에 따라 차감됩니다.
      </p>
    </div>
  );
}
