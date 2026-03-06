import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../firebase-admin";
import {
  getMonthKeyKst,
  PLANS,
  type QuotaModel,
} from "@gyoanmaker/shared/plans";
import {
  assertCanConsume,
  buildPersistPayload,
  buildQuotaStatus,
  consumeCredits,
  normalizeUserState,
} from "./resolvers";
import {
  COLLECTION,
  DEFAULT_QUOTA,
  QuotaExceededError,
  type QuotaLimitsUpdate,
  type QuotaStatus,
  type UserDocLike,
} from "./types";

export async function getQuotaStatus(email: string): Promise<QuotaStatus> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);
  const snap = await docRef.get();
  const state = normalizeUserState((snap.data() ?? {}) as UserDocLike, new Date());

  if (state.needsPersist) {
    await docRef.set(buildPersistPayload(state), { merge: true });
  }

  return buildQuotaStatus(state);
}

export async function incrementUsage(
  email: string,
  model: QuotaModel,
  amount = 1
): Promise<QuotaStatus> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  const result = await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const state = normalizeUserState((snap.data() ?? {}) as UserDocLike, new Date());

    assertCanConsume(state, model, amount);

    if (amount > 0) {
      const targetQuota = state.quota[model];
      const subRemaining = Math.max(0, targetQuota.monthlyLimit - targetQuota.used);
      const fromSub = Math.min(subRemaining, amount);
      targetQuota.used += fromSub;

      const needCredits = amount - fromSub;
      if (needCredits > 0) {
        const consumed = consumeCredits(state.credits[model], needCredits);
        state.credits[model] = consumed.updated;
        if (consumed.consumed < needCredits) {
          throw new QuotaExceededError(model, amount, fromSub + consumed.consumed);
        }
      }

      const totalUsed = state.quota.flash.used + state.quota.pro.used;
      state.legacyUsageMonthly = {
        key: state.quota.flash.monthKeyKst,
        count: totalUsed,
      };
      state.legacyUsageDaily = {
        ...state.legacyUsageDaily,
        count: Math.max(state.legacyUsageDaily.count, totalUsed),
      };
    }

    tx.set(docRef, buildPersistPayload(state), { merge: true });
    return buildQuotaStatus(state);
  });

  return result;
}

export async function setQuotaLimits(
  email: string,
  limits: QuotaLimitsUpdate
): Promise<void> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const state = normalizeUserState((snap.data() ?? {}) as UserDocLike, new Date());

    if (limits.flashMonthlyLimit !== undefined) {
      state.quota.flash.monthlyLimit = Math.max(
        1,
        Math.floor(limits.flashMonthlyLimit)
      );
      state.quota.flash.used = Math.min(
        state.quota.flash.used,
        state.quota.flash.monthlyLimit
      );
    }

    if (limits.proMonthlyLimit !== undefined) {
      state.quota.pro.monthlyLimit = Math.max(
        1,
        Math.floor(limits.proMonthlyLimit)
      );
      state.quota.pro.used = Math.min(
        state.quota.pro.used,
        state.quota.pro.monthlyLimit
      );
    }

    if (limits.storageLimit !== undefined) {
      state.quota.storageLimit =
        limits.storageLimit === null
          ? null
          : Math.max(0, Math.floor(limits.storageLimit));
      if (state.quota.storageLimit !== null) {
        state.quota.storageUsed = Math.min(
          state.quota.storageUsed,
          state.quota.storageLimit
        );
      }
    }

    tx.set(docRef, buildPersistPayload(state), { merge: true });
  });
}

export async function setStorageUsed(email: string, used: number): Promise<void> {
  const key = email.toLowerCase();
  const nextUsed = Math.max(0, Math.floor(used));
  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set(
      {
        quota: { storageUsed: nextUsed },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function purgeExpiredCredits(email: string): Promise<number> {
  const key = email.toLowerCase();
  const docRef = getDb().collection(COLLECTION).doc(key);

  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const original = (snap.data() ?? {}) as UserDocLike;
    const state = normalizeUserState(original, new Date());

    const beforeFlash = Array.isArray(original.credits?.flash)
      ? original.credits?.flash.length
      : 0;
    const beforePro = Array.isArray(original.credits?.pro)
      ? original.credits?.pro.length
      : 0;
    const removed =
      beforeFlash +
      beforePro -
      (state.credits.flash.length + state.credits.pro.length);

    if (removed > 0 || state.needsPersist) {
      tx.set(docRef, buildPersistPayload(state), { merge: true });
    }

    return removed;
  });
}

export async function initializeQuota(email: string): Promise<void> {
  const key = email.toLowerCase();
  const monthKeyKst = getMonthKeyKst();
  const free = PLANS.free;

  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set(
      {
        quota: {
          ...DEFAULT_QUOTA,
          flash: { monthlyLimit: free.flashLimit, used: 0, monthKeyKst },
          pro: { monthlyLimit: free.proLimit, used: 0, monthKeyKst },
          storageLimit: free.storageLimit,
          storageUsed: 0,
        },
        credits: {
          flash: [],
          pro: [],
        },
        usage: {
          daily: { count: 0, key: new Date().toISOString().slice(0, 10) },
          monthly: { count: 0, key: monthKeyKst },
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export { DEFAULT_QUOTA, QuotaExceededError };
export type {
  LegacyQuotaLimits,
  QuotaLimitsUpdate,
  QuotaModelStatus,
  QuotaStatus,
} from "./types";
