"use client";

import { useState, useCallback } from "react";
import { PLANS, type PlanId } from "@gyoanmaker/shared/plans";
import TossPaymentButton from "./TossPaymentButton";
import PlanDowngradeModal from "./PlanDowngradeModal";
import PlanUpgradeModal from "./PlanUpgradeModal";

const TIER_ORDER: Record<PlanId, number> = {
  free: 0,
  basic: 1,
  standard: 2,
  pro: 3,
};

function isDowngrade(current: PlanId, target: PlanId): boolean {
  return TIER_ORDER[target] < TIER_ORDER[current];
}

function isUpgrade(current: PlanId, target: PlanId): boolean {
  return TIER_ORDER[target] > TIER_ORDER[current] && current !== "free";
}

function hasActivePeriod(
  currentPlan: PlanId,
  currentPeriodEndAt: string | null
): boolean {
  if (currentPlan === "free" || !currentPeriodEndAt) return false;
  return new Date(currentPeriodEndAt).getTime() > Date.now();
}

type CheckoutFlow = "widget" | "paylink";

interface PlanChangeIntent {
  targetPlan: PlanId;
  checkoutFlow: CheckoutFlow;
  direction: "upgrade" | "downgrade";
}

interface PlanSectionProps {
  currentPlan: PlanId;
  currentPeriodEndAt?: string | null;
  targetPlan?: PlanId | null;
}

export default function PlanSection({
  currentPlan,
  currentPeriodEndAt = null,
  targetPlan,
}: PlanSectionProps) {
  const [changeIntent, setChangeIntent] = useState<PlanChangeIntent | null>(
    null
  );
  const [scheduledCheckout, setScheduledCheckout] = useState<{
    targetPlan: PlanId;
    checkoutFlow: CheckoutFlow;
  } | null>(null);
  const [confirmedUpgrade, setConfirmedUpgrade] = useState<{
    targetPlan: PlanId;
    checkoutFlow: CheckoutFlow;
  } | null>(null);

  const handlePlanClick = useCallback(
    (planId: PlanId, checkoutFlow: CheckoutFlow) => {
      const active = hasActivePeriod(currentPlan, currentPeriodEndAt);
      if (!active) return false;

      if (isDowngrade(currentPlan, planId)) {
        setChangeIntent({
          targetPlan: planId,
          checkoutFlow,
          direction: "downgrade",
        });
        return true;
      }

      if (isUpgrade(currentPlan, planId)) {
        setChangeIntent({
          targetPlan: planId,
          checkoutFlow,
          direction: "upgrade",
        });
        return true;
      }

      return false;
    },
    [currentPlan, currentPeriodEndAt]
  );

  // Downgrade: scheduled
  const handleScheduled = useCallback(() => {
    if (!changeIntent) return;
    setScheduledCheckout({
      targetPlan: changeIntent.targetPlan,
      checkoutFlow: changeIntent.checkoutFlow,
    });
    setChangeIntent(null);
  }, [changeIntent]);

  // Downgrade: immediate — proceed to normal (non-scheduled) checkout
  const handleImmediate = useCallback(() => {
    if (!changeIntent) return;
    setConfirmedUpgrade({
      targetPlan: changeIntent.targetPlan,
      checkoutFlow: changeIntent.checkoutFlow,
    });
    setChangeIntent(null);
    setScheduledCheckout(null);
  }, [changeIntent]);

  // Upgrade: confirmed
  const handleUpgradeConfirm = useCallback(() => {
    if (!changeIntent) return;
    setConfirmedUpgrade({
      targetPlan: changeIntent.targetPlan,
      checkoutFlow: changeIntent.checkoutFlow,
    });
    setChangeIntent(null);
  }, [changeIntent]);

  const handleCancel = useCallback(() => {
    setChangeIntent(null);
  }, []);

  // Determine which plans need interception (downgrade or upgrade with active period)
  const needsInterception = (planId: PlanId): boolean => {
    if (!hasActivePeriod(currentPlan, currentPeriodEndAt)) return false;
    return isDowngrade(currentPlan, planId) || isUpgrade(currentPlan, planId);
  };

  return (
    <div>
      <p className="mb-4 text-xs text-gray-400">
        구매 즉시 적용 · 30일 이용권 · VAT 별도
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(
          Object.entries(PLANS) as Array<[PlanId, (typeof PLANS)[PlanId]]>
        ).map(([planId, plan]) => {
          if (planId === "free") return null;
          const isCurrent = planId === currentPlan;
          const isTarget = planId === targetPlan;
          const intercept = needsInterception(planId);

          return (
            <div
              key={planId}
              className={`relative rounded-xl border-2 p-5 transition-shadow ${
                isTarget
                  ? "border-blue-500 shadow-lg shadow-blue-100"
                  : isCurrent
                    ? "border-blue-300 bg-blue-50/50"
                    : "border-gray-200"
              }`}
            >
              {/* Badges */}
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {planId.toUpperCase()}
                </h3>
                {isCurrent && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    현재 플랜
                  </span>
                )}
                {isTarget && !isCurrent && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    추천
                  </span>
                )}
              </div>

              <p className="text-2xl font-extrabold text-gray-900">
                ₩{plan.price.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">/ 30일</p>

              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                <li>속도 {plan.flashLimit}회</li>
                <li>정밀 {plan.proLimit}회</li>
                <li>삽화 {plan.illustrationMonthlyLimit}/월</li>
              </ul>

              <p className="mt-4 text-xs text-gray-500">결제 방식 선택</p>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {intercept ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePlanClick(planId, "widget")}
                      className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                    >
                      {isCurrent ? "위젯 연장" : "위젯 구매"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlanClick(planId, "paylink")}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      {isCurrent ? "페이링크 연장" : "페이링크 구매"}
                    </button>
                  </>
                ) : (
                  <>
                    <TossPaymentButton
                      type="plan"
                      planId={planId}
                      checkoutFlow="widget"
                      label={isCurrent ? "위젯 연장" : "위젯 구매"}
                      className="w-full bg-gray-900 hover:bg-gray-800"
                    />
                    <TossPaymentButton
                      type="plan"
                      planId={planId}
                      checkoutFlow="paylink"
                      label={isCurrent ? "페이링크 연장" : "페이링크 구매"}
                      className="w-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                    />
                  </>
                )}
              </div>
              <p className="mt-2 text-[11px] text-amber-600">
                페이링크 결제는 승인 완료 후 활성화됩니다.
              </p>
            </div>
          );
        })}
      </div>

      {/* Downgrade warning modal */}
      {changeIntent?.direction === "downgrade" && currentPeriodEndAt && (
        <PlanDowngradeModal
          currentPlan={currentPlan}
          targetPlan={changeIntent.targetPlan}
          currentPeriodEndAt={currentPeriodEndAt}
          onScheduled={handleScheduled}
          onImmediate={handleImmediate}
          onCancel={handleCancel}
        />
      )}

      {/* Upgrade warning modal */}
      {changeIntent?.direction === "upgrade" && currentPeriodEndAt && (
        <PlanUpgradeModal
          currentPlan={currentPlan}
          targetPlan={changeIntent.targetPlan}
          currentPeriodEndAt={currentPeriodEndAt}
          onConfirm={handleUpgradeConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Scheduled checkout (downgrade) */}
      {scheduledCheckout && (
        <ScheduledCheckoutTrigger
          targetPlan={scheduledCheckout.targetPlan}
          checkoutFlow={scheduledCheckout.checkoutFlow}
          onDone={() => setScheduledCheckout(null)}
        />
      )}

      {/* Confirmed upgrade — proceed to normal checkout */}
      {confirmedUpgrade && (
        <ConfirmedCheckoutTrigger
          targetPlan={confirmedUpgrade.targetPlan}
          checkoutFlow={confirmedUpgrade.checkoutFlow}
          onDone={() => setConfirmedUpgrade(null)}
        />
      )}
    </div>
  );
}

function ScheduledCheckoutTrigger({
  targetPlan,
  checkoutFlow,
  onDone,
}: {
  targetPlan: PlanId;
  checkoutFlow: CheckoutFlow;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="mb-4 text-sm text-gray-700">
          {targetPlan.toUpperCase()} 예약 결제를 진행합니다.
        </p>
        <TossPaymentButton
          type="plan"
          planId={targetPlan}
          checkoutFlow={checkoutFlow}
          scheduled
          label="결제 진행"
          className="w-full bg-blue-600 hover:bg-blue-700"
        />
        <button
          type="button"
          onClick={onDone}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function ConfirmedCheckoutTrigger({
  targetPlan,
  checkoutFlow,
  onDone,
}: {
  targetPlan: PlanId;
  checkoutFlow: CheckoutFlow;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="mb-4 text-sm text-gray-700">
          {targetPlan.toUpperCase()} 결제를 진행합니다.
        </p>
        <TossPaymentButton
          type="plan"
          planId={targetPlan}
          checkoutFlow={checkoutFlow}
          label="결제 진행"
          className="w-full bg-blue-600 hover:bg-blue-700"
        />
        <button
          type="button"
          onClick={onDone}
          className="mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
