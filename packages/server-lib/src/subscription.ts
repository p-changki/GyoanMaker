import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import {
  getCreditExpiryIso,
  getMonthKeyKst,
  getNowIso,
  type PlanId,
  PLANS,
  type QuotaModel,
} from "@gyoanmaker/shared/plans";
import type { CreditEntry, UserCredits, UserPlan } from "@gyoanmaker/shared/types";

const COLLECTION = "users";
const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

interface UserDocLike {
  plan?: UserPlan & { status?: string };
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
  // Handle legacy Firestore values: past_due / canceled → active
  const rawStatus = doc.plan?.status;
  const status = rawStatus === "active" || rawStatus === "expired" ? rawStatus : "active";

  return {
    tier,
    status,
    currentPeriodStartAt: doc.plan?.currentPeriodStartAt ?? now,
    currentPeriodEndAt:
      doc.plan?.currentPeriodEndAt === undefined ? null : doc.plan.currentPeriodEndAt,
  };
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

function resolveNextPeriodEnd(
  currentPlan: UserPlan,
  targetPlan: PlanId,
  nowIso: string
): string | null {
  if (targetPlan === "free") {
    return null;
  }

  if (currentPlan.tier === targetPlan && currentPlan.currentPeriodEndAt) {
    const currentEndMs = new Date(currentPlan.currentPeriodEndAt).getTime();
    if (Number.isFinite(currentEndMs) && currentEndMs > Date.now()) {
      return new Date(currentEndMs + PERIOD_MS).toISOString();
    }
  }

  return buildPeriodEnd(nowIso);
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

/**
 * Activate a plan immediately (always forceImmediate).
 * Same tier = period extension (new 30-day window from now).
 */
export async function changePlan(
  email: string,
  targetPlan: PlanId
): Promise<UserPlan> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const currentPlan = normalizePlan(data);

    const now = getNowIso();
    const periodKey = targetPlan === "free" ? getMonthKeyKst() : now.slice(0, 10);

    const nextPlan: UserPlan = {
      tier: targetPlan,
      status: "active",
      currentPeriodStartAt: now,
      currentPeriodEndAt: resolveNextPeriodEnd(currentPlan, targetPlan, now),
    };

    tx.set(
      docRef,
      {
        plan: nextPlan,
        planPendingTier: FieldValue.delete(),
        planPendingApplyAt: FieldValue.delete(),
        billingKey: FieldValue.delete(),
        quota: upsertPlanLimits(data, targetPlan, periodKey),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return nextPlan;
  });
}

/**
 * Manually grants a plan with a custom end date (for bank transfer / admin override).
 * Unlike changePlan, this accepts an explicit periodEndAt instead of auto-calculating it.
 */
export async function changePlanManual(
  email: string,
  targetPlan: PlanId,
  periodEndAt: string | null
): Promise<UserPlan> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;

    const now = getNowIso();
    const periodKey = targetPlan === "free" ? getMonthKeyKst() : now.slice(0, 10);

    const nextPlan: UserPlan = {
      tier: targetPlan,
      status: "active",
      currentPeriodStartAt: now,
      currentPeriodEndAt: targetPlan === "free" ? null : (periodEndAt ?? null),
    };

    tx.set(
      docRef,
      {
        plan: nextPlan,
        planPendingTier: FieldValue.delete(),
        planPendingApplyAt: FieldValue.delete(),
        billingKey: FieldValue.delete(),
        quota: upsertPlanLimits(data, targetPlan, periodKey),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return nextPlan;
  });
}

/**
 * Schedule a plan change to take effect when the current period expires.
 * Payment is already confirmed — only the plan application is deferred.
 */
export async function schedulePlanChange(
  email: string,
  targetPlan: PlanId
): Promise<{ planPendingTier: PlanId; planPendingApplyAt: string | null }> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const plan = normalizePlan(data);

    const applyAt = plan.currentPeriodEndAt ?? null;

    tx.set(
      docRef,
      {
        planPendingTier: targetPlan,
        planPendingApplyAt: applyAt,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { planPendingTier: targetPlan, planPendingApplyAt: applyAt };
  });
}

/**
 * Lazily expires a plan if currentPeriodEndAt is in the past.
 * If planPendingTier exists, applies that plan instead of free.
 * Returns true if the plan was expired.
 */
export async function expirePlanIfNeeded(email: string): Promise<boolean> {
  const key = email.toLowerCase();
  const snap = await getDb().collection(COLLECTION).doc(key).get();
  const data = (snap.data() ?? {}) as UserDocLike & {
    planPendingTier?: string;
  };
  const plan = normalizePlan(data);

  if (plan.tier === "free") return false;
  if (!plan.currentPeriodEndAt) return false;

  const now = new Date();
  const periodEnd = new Date(plan.currentPeriodEndAt);
  if (now <= periodEnd) return false;

  const pendingTier = data.planPendingTier;
  if (pendingTier && pendingTier in PLANS) {
    await changePlan(email, pendingTier as PlanId);
  } else {
    await changePlan(email, "free");
  }
  return true;
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
  const total = Math.max(0, Math.floor(amount));
  const entry: CreditEntry = {
    remaining: total,
    total,
    purchasedAt,
    expiresAt: getCreditExpiryIso(now),
    ...(orderId ? { orderId } : {}),
  };

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = (snap.data() ?? {}) as UserDocLike;
    const credits = normalizeCredits(data);

    // Dedup: skip if orderId already exists in credits
    if (orderId && credits[type].some((c) => c.orderId === orderId)) {
      return credits;
    }

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

export interface SubscriptionExtended {
  subscription: UserPlan;
  createdAt: string | null;
  credits: { flash: CreditEntry[]; pro: CreditEntry[]; illustration: CreditEntry[] };
}

export async function getSubscriptionExtended(
  email: string
): Promise<SubscriptionExtended> {
  const key = email.toLowerCase();
  const snap = await getDb().collection(COLLECTION).doc(key).get();
  const data = (snap.data() ?? {}) as UserDocLike & {
    createdAt?: string;
  };

  const subscription = normalizePlan(data);
  const credits = normalizeCredits(data);
  const createdAt =
    typeof data.createdAt === "string" ? data.createdAt : null;

  return { subscription, createdAt, credits };
}
