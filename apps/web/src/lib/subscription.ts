import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import {
  getCreditExpiryIso,
  getNowIso,
  type PaymentMethod,
  type PlanId,
  PLANS,
  type QuotaModel,
} from "@gyoanmaker/shared/plans";
import type { CreditEntry, UserCredits, UserPlan } from "@gyoanmaker/shared/types";

const COLLECTION = "users";
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

interface UserDocLike {
  plan?: UserPlan;
  planPendingTier?: PlanId;
  quota?: {
    flash?: { monthlyLimit?: number; used?: number; monthKeyKst?: string };
    pro?: { monthlyLimit?: number; used?: number; monthKeyKst?: string };
    illustration?: { monthlyLimit?: number; used?: number; monthKeyKst?: string };
    storageLimit?: number | null;
    storageUsed?: number;
  };
  credits?: UserCredits;
}

function normalizePlan(doc: UserDocLike): UserPlan {
  const now = getNowIso();
  const tier = doc.plan?.tier ?? "free";
  const status =
    doc.plan?.status === "past_due" || doc.plan?.status === "canceled"
      ? doc.plan.status
      : "active";

  return {
    tier,
    status,
    currentPeriodStartAt: doc.plan?.currentPeriodStartAt ?? now,
    currentPeriodEndAt:
      doc.plan?.currentPeriodEndAt === undefined ? null : doc.plan.currentPeriodEndAt,
    paymentMethod: doc.plan?.paymentMethod ?? null,
  };
}

export interface ChangePlanOptions {
  forceImmediate?: boolean;
  paymentMethod?: PaymentMethod | null;
}

function normalizeCredits(doc: UserDocLike): UserCredits {
  return {
    flash: Array.isArray(doc.credits?.flash) ? doc.credits.flash : [],
    pro: Array.isArray(doc.credits?.pro) ? doc.credits.pro : [],
    illustration: Array.isArray(doc.credits?.illustration) ? doc.credits.illustration : [],
  };
}

function buildPeriodEnd(startIso: string): string {
  return new Date(new Date(startIso).getTime() + PERIOD_MS).toISOString();
}

function upsertPlanLimits(
  doc: UserDocLike,
  targetPlan: PlanId,
  periodKey: string
) {
  const target = PLANS[targetPlan];
  return {
    flash: {
      monthlyLimit: target.flashLimit,
      used: 0,
      monthKeyKst: periodKey,
    },
    pro: {
      monthlyLimit: target.proLimit,
      used: 0,
      monthKeyKst: periodKey,
    },
    illustration: {
      monthlyLimit: target.illustrationMonthlyLimit,
      used: 0,
      monthKeyKst: periodKey,
    },
    storageLimit: target.storageLimit,
    storageUsed: Math.max(0, Math.floor(doc.quota?.storageUsed ?? 0)),
  };
}

export async function getSubscription(email: string): Promise<UserPlan> {
  const key = email.toLowerCase();
  const snap = await getDb().collection(COLLECTION).doc(key).get();
  const data = (snap.data() ?? {}) as UserDocLike;
  return normalizePlan(data);
}

export async function changePlan(
  email: string,
  targetPlan: PlanId,
  options: ChangePlanOptions = {}
): Promise<UserPlan> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const currentPlan = normalizePlan(data);

    if (currentPlan.tier === targetPlan) {
      return currentPlan;
    }

    const currentPrice = PLANS[currentPlan.tier].price;
    const targetPrice = PLANS[targetPlan].price;
    const now = getNowIso();
    const periodKey = now.slice(0, 10);

    if (options.forceImmediate || targetPrice >= currentPrice) {
      const resolvedPaymentMethod =
        options.paymentMethod !== undefined
          ? options.paymentMethod
          : targetPlan === "free"
            ? null
            : currentPlan.paymentMethod ?? "mock";
      const nextPlan: UserPlan = {
        tier: targetPlan,
        status: "active",
        currentPeriodStartAt: now,
        currentPeriodEndAt: targetPlan === "free" ? null : buildPeriodEnd(now),
        paymentMethod: resolvedPaymentMethod,
      };

      tx.set(
        docRef,
        {
          plan: nextPlan,
          planPendingTier: FieldValue.delete(),
          quota: upsertPlanLimits(data, targetPlan, periodKey),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return nextPlan;
    }

    const nextPeriodEnd =
      currentPlan.currentPeriodEndAt ?? buildPeriodEnd(currentPlan.currentPeriodStartAt);
    const scheduledPlan: UserPlan = {
      ...currentPlan,
      currentPeriodEndAt: nextPeriodEnd,
    };

    tx.set(
      docRef,
      {
        plan: scheduledPlan,
        planPendingTier: targetPlan,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return scheduledPlan;
  });
}

export async function addTopUpCredits(
  email: string,
  type: QuotaModel | "illustration",
  amount: number,
  orderId?: string
): Promise<UserCredits> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);
  const now = new Date();
  const purchasedAt = now.toISOString();
  const entry: CreditEntry = {
    remaining: Math.max(0, Math.floor(amount)),
    purchasedAt,
    expiresAt: getCreditExpiryIso(now),
    ...(orderId ? { orderId } : {}),
  };

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const credits = normalizeCredits(data);

    credits[type] = [...credits[type], entry].sort((a, b) => {
      return (
        new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
      );
    });

    tx.set(
      docRef,
      {
        credits,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return credits;
  });
}

export async function cancelSubscription(email: string): Promise<UserPlan> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const currentPlan = normalizePlan(data);

    if (currentPlan.tier === "free") {
      return currentPlan;
    }

    if (currentPlan.status === "canceled") {
      return currentPlan;
    }

    const periodEnd =
      currentPlan.currentPeriodEndAt ?? buildPeriodEnd(currentPlan.currentPeriodStartAt);

    const canceledPlan: UserPlan = {
      ...currentPlan,
      status: "canceled",
      currentPeriodEndAt: periodEnd,
    };

    tx.set(
      docRef,
      {
        plan: canceledPlan,
        planPendingTier: "free",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return canceledPlan;
  });
}


export async function renewSubscription(email: string): Promise<UserPlan> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const currentPlan = normalizePlan(data);

    if (currentPlan.tier === "free") {
      return currentPlan;
    }

    const now = getNowIso();
    const periodKey = now.slice(0, 10);

    const renewedPlan: UserPlan = {
      tier: currentPlan.tier,
      status: "active",
      currentPeriodStartAt: now,
      currentPeriodEndAt: buildPeriodEnd(now),
      paymentMethod: currentPlan.paymentMethod,
    };

    tx.set(
      docRef,
      {
        plan: renewedPlan,
        quota: upsertPlanLimits(data, currentPlan.tier, periodKey),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return renewedPlan;
  });
}

export async function markPlanPastDue(email: string): Promise<UserPlan> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const currentPlan = normalizePlan(data);

    if (currentPlan.tier === "free") {
      return currentPlan;
    }

    const pastDuePlan: UserPlan = {
      ...currentPlan,
      status: "past_due",
    };

    tx.set(
      docRef,
      {
        plan: pastDuePlan,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return pastDuePlan;
  });
}

export interface SubscriptionExtended {
  subscription: UserPlan;
  planPendingTier: PlanId | null;
  createdAt: string | null;
  credits: { flash: CreditEntry[]; pro: CreditEntry[]; illustration: CreditEntry[] };
}

export async function getSubscriptionExtended(
  email: string
): Promise<SubscriptionExtended> {
  const key = email.toLowerCase();
  const snap = await getDb().collection(COLLECTION).doc(key).get();
  const data = (snap.data() ?? {}) as UserDocLike & {
    planPendingTier?: PlanId;
    createdAt?: string;
  };

  const subscription = normalizePlan(data);
  const credits = normalizeCredits(data);
  const planPendingTier =
    typeof data.planPendingTier === "string" && data.planPendingTier in PLANS
      ? (data.planPendingTier as PlanId)
      : null;
  const createdAt =
    typeof data.createdAt === "string" ? data.createdAt : null;

  return { subscription, planPendingTier, createdAt, credits };
}
