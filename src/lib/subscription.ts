import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { getCreditExpiryIso, getNowIso, type PlanId, PLANS, type QuotaModel } from "./plans";
import type { CreditEntry, UserCredits, UserPlan } from "./types";

const COLLECTION = "users";

interface UserDocLike {
  plan?: UserPlan;
  planPendingTier?: PlanId;
  quota?: {
    flash?: { monthlyLimit?: number; used?: number; monthKeyKst?: string };
    pro?: { monthlyLimit?: number; used?: number; monthKeyKst?: string };
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

function normalizeCredits(doc: UserDocLike): UserCredits {
  return {
    flash: Array.isArray(doc.credits?.flash) ? doc.credits.flash : [],
    pro: Array.isArray(doc.credits?.pro) ? doc.credits.pro : [],
  };
}

function upsertPlanLimits(doc: UserDocLike, targetPlan: PlanId) {
  const target = PLANS[targetPlan];
  const flashUsed = Math.min(
    target.flashLimit,
    Math.max(0, Math.floor(doc.quota?.flash?.used ?? 0))
  );
  const proUsed = Math.min(
    target.proLimit,
    Math.max(0, Math.floor(doc.quota?.pro?.used ?? 0))
  );
  const monthKeyKst = doc.quota?.flash?.monthKeyKst ?? doc.quota?.pro?.monthKeyKst ?? "";

  return {
    flash: {
      monthlyLimit: target.flashLimit,
      used: flashUsed,
      monthKeyKst,
    },
    pro: {
      monthlyLimit: target.proLimit,
      used: proUsed,
      monthKeyKst,
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

export async function changePlan(email: string, targetPlan: PlanId): Promise<UserPlan> {
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

    if (targetPrice >= currentPrice) {
      const nextPlan: UserPlan = {
        tier: targetPlan,
        status: "active",
        currentPeriodStartAt: now,
        currentPeriodEndAt: null,
        paymentMethod: currentPlan.paymentMethod ?? "mock",
      };

      tx.set(
        docRef,
        {
          plan: nextPlan,
          planPendingTier: FieldValue.delete(),
          quota: upsertPlanLimits(data, targetPlan),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return nextPlan;
    }

    const nextPeriodEnd =
      currentPlan.currentPeriodEndAt ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
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
  type: QuotaModel,
  amount: number
): Promise<UserCredits> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);
  const now = new Date();
  const purchasedAt = now.toISOString();
  const entry: CreditEntry = {
    remaining: Math.max(0, Math.floor(amount)),
    purchasedAt,
    expiresAt: getCreditExpiryIso(now),
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

export async function cancelSubscription(email: string): Promise<void> {
  const key = email.toLowerCase();
  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set(
      {
        plan: {
          status: "canceled",
          currentPeriodEndAt:
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
