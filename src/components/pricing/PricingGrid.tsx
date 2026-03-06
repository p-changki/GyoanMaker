"use client";

import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/plans";
import PricingCard from "./PricingCard";

interface PricingGridProps {
  currentPlan?: PlanId;
}

export default function PricingGrid({ currentPlan }: PricingGridProps) {
  const router = useRouter();

  const handleSelect = (planId: PlanId) => {
    router.push(`/account?targetPlan=${planId}`);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {(Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>).map(
        ([planId, plan]) => (
          <PricingCard
            key={planId}
            planId={planId}
            plan={plan}
            currentPlan={currentPlan}
            onSelect={handleSelect}
          />
        )
      )}
    </div>
  );
}
