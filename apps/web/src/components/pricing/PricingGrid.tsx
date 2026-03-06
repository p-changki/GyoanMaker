"use client";

import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {(Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>).map(
          ([planId, plan]) => (
            <PricingCard
              key={planId}
              planId={planId}
              plan={plan}
              currentPlan={currentPlan}
              recommended={planId === "basic"}
              onSelect={handleSelect}
            />
          )
        )}
      </div>
      <p className="text-center text-xs text-gray-400">
        콘텐츠 난이도(상위권/기초)와 관계없이, 선택한 생성 모드에 따라
        차감됩니다.
      </p>
    </div>
  );
}
