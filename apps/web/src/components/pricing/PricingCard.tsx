"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { PlanDefinition, PlanId } from "@gyoanmaker/shared/plans";

interface PricingCardProps {
  planId: PlanId;
  plan: PlanDefinition;
  currentPlan?: PlanId;
  recommended?: boolean;
  onSelect: (planId: PlanId) => void;
  index: number;
  totalPlans: number;
}

const PLAN_META: Record<
  PlanId,
  { label: string; description: string; features: string[] }
> = {
  free: {
    label: "Free",
    description: "Perfect for trying out the service",
    features: [
      "10 Speed gen / mo",
      "2 Precision gen / mo",
      "Up to 3 handouts",
      "Basic PDF export",
    ],
  },
  basic: {
    label: "Basic",
    description: "For individual tutors & small academies",
    features: [
      "250 Speed gen / mo",
      "30 Precision gen / mo",
      "Unlimited storage",
      "PDF export",
      "Credit top-up",
    ],
  },
  standard: {
    label: "Standard",
    description: "For mid-size academies",
    features: [
      "500 Speed gen / mo",
      "120 Precision gen / mo",
      "Unlimited storage",
      "PDF export",
      "Credit top-up",
      "Priority processing",
    ],
  },
  pro: {
    label: "Pro",
    description: "For large academies & franchises",
    features: [
      "1,000 Speed gen / mo",
      "400 Precision gen / mo",
      "Unlimited storage",
      "PDF export",
      "Credit top-up",
      "Priority processing",
    ],
  },
};

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return price.toLocaleString("ko-KR");
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PricingCard({
  planId,
  plan,
  currentPlan,
  recommended,
  onSelect,
  index,
  totalPlans,
}: PricingCardProps) {
  const isCurrent = currentPlan === planId;
  const meta = PLAN_META[planId];
  const isEdge = index === 0 || index === totalPlans - 1;

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{
        y: recommended ? -8 : 0,
        opacity: 1,
        scale: isEdge ? 0.97 : 1.0,
      }}
      viewport={{ once: true }}
      transition={{
        duration: 1.2,
        type: "spring",
        stiffness: 100,
        damping: 30,
        delay: index * 0.1,
      }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-lg",
        recommended ? "border-blue-600 border-2 z-10" : "border-gray-200",
        !recommended && "mt-0 md:mt-4"
      )}
    >
      {/* Popular badge */}
      {recommended && (
        <div className="absolute right-0 top-0 flex items-center rounded-bl-xl rounded-tr-xl bg-blue-600 px-2.5 py-0.5">
          <svg
            className="h-3.5 w-3.5 fill-current text-white"
            viewBox="0 0 24 24"
          >
            <title>Popular</title>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="ml-1 text-xs font-semibold text-white">
            Popular
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        {/* Plan name */}
        <p className="text-sm font-semibold text-gray-500">{meta.label}</p>

        {/* Price */}
        <div className="mt-4 flex items-baseline justify-center gap-1">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              Free
            </span>
          ) : (
            <>
              <span className="text-xs font-medium text-gray-400">₩</span>
              <span className="text-3xl font-bold tracking-tight text-gray-900">
                {formatPrice(plan.price)}
              </span>
              <span className="text-xs font-medium text-gray-400">/mo</span>
            </>
          )}
        </div>

        <p className="mt-1 text-[11px] text-gray-400">
          {plan.price === 0 ? "No credit card required" : "VAT excluded"}
        </p>

        {/* Features */}
        <ul className="mt-5 flex flex-col gap-2">
          {meta.features.map((feature) => (
            <li key={feature} className="flex items-start gap-1.5 text-left">
              <CheckIcon />
              <span className="text-xs text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        <hr className="my-4 border-gray-100" />

        {/* Current plan badge */}
        {isCurrent && (
          <div className="mb-2 text-center">
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-600">
              Current Plan
            </span>
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={() => onSelect(planId)}
          disabled={isCurrent}
          className={cn(
            "mt-auto w-full rounded-xl py-2.5 text-sm font-bold transition-all",
            isCurrent
              ? "cursor-default border border-gray-200 bg-gray-50 text-gray-400"
              : recommended
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:ring-2 hover:ring-blue-600 hover:ring-offset-1"
                : "bg-gray-900 text-white hover:bg-gray-800 hover:ring-2 hover:ring-gray-900 hover:ring-offset-1"
          )}
        >
          {isCurrent ? "Current Plan" : "Get Started"}
        </button>

        <p className="mt-3 text-[11px] leading-4 text-gray-400">
          {meta.description}
        </p>
      </div>
    </motion.div>
  );
}
