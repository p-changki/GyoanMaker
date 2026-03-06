import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import {
  getMonthKeyKst,
  type PlanId,
  PLANS,
  type QuotaModel,
} from "./plans";
import type { CreditEntry, UserCredits, UserPlan, UserQuota } from "./types";

const COLLECTION = "users";
const DEFAULT_PLAN: PlanId = "free";
const LEGACY_DEFAULT_DAILY_LIMIT = 50;
const LEGACY_DEFAULT_MONTHLY_LIMIT = 500;

export interface LegacyQuotaLimits {
  dailyLimit: number;
  monthlyLimit: number;
}

export const DEFAULT_QUOTA: LegacyQuotaLimits = {
  dailyLimit: LEGACY_DEFAULT_DAILY_LIMIT,
  monthlyLimit: LEGACY_DEFAULT_MONTHLY_LIMIT,
};

export interface QuotaModelStatus {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
}

export interface QuotaStatus {
  plan: PlanId;
  monthKeyKst: string;
  flash: QuotaModelStatus;
  pro: QuotaModelStatus;
  storage: {
    limit: number | null;
    used: number;
    remaining: number | null;
  };
  canGenerate: boolean;
  canGenerateByModel: Record<QuotaModel, boolean>;
}

export interface QuotaLimitsUpdate {
  flashMonthlyLimit?: number;
  proMonthlyLimit?: number;
  storageLimit?: number | null;
}

interface UserDocLike {
  plan?: {
    tier?: PlanId;
    status?: string;
    currentPeriodStartAt?: string;
    currentPeriodEndAt?: string | null;
    paymentMethod?: string | null;
  };
  quota?: {
    dailyLimit?: number;
    monthlyLimit?: number;
    storageLimit?: number | null;
    storageUsed?: number;
    flash?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
    pro?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
  };
  usage?: {
    daily?: { count?: number; key?: string };
    monthly?: { count?: number; key?: string };
  };
  credits?: {
    flash?: CreditEntry[];
    pro?: CreditEntry[];
  };
}

interface NormalizedUserState {
  plan: UserPlan;
  quota: UserQuota;
  credits: UserCredits;
  legacyUsageDaily: { count: number; key: string };
  legacyUsageMonthly: { count: number; key: string };
  needsPersist: boolean;
}

export class QuotaExceededError extends Error {
  readonly code = "QUOTA_EXCEEDED";
  readonly model: QuotaModel;
  readonly needed: number;
  readonly available: number;

  constructor(model: QuotaModel, needed: number, available: number) {
    super(`${model.toUpperCase()} quota exceeded: need ${needed}, have ${available}`);
    this.name = "QuotaExceededError";
    this.model = model;
    this.needed = needed;
    this.available = available;
  }
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function toNonNegativeInt(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

function resolvePlan(data: UserDocLike): UserPlan {
  const tier = data.plan?.tier;
  const safeTier = !tier || !(tier in PLANS) ? DEFAULT_PLAN : tier;
  const status =
    data.plan?.status === "past_due" ||
    data.plan?.status === "canceled" ||
    data.plan?.status === "active"
      ? data.plan.status
      : "active";
  const nowIso = new Date().toISOString();

  return {
    tier: safeTier,
    status,
    currentPeriodStartAt:
      typeof data.plan?.currentPeriodStartAt === "string"
        ? data.plan.currentPeriodStartAt
        : nowIso,
    currentPeriodEndAt:
      typeof data.plan?.currentPeriodEndAt === "string" ||
      data.plan?.currentPeriodEndAt === null
        ? data.plan.currentPeriodEndAt
        : null,
    paymentMethod:
      data.plan?.paymentMethod === "mock" || data.plan?.paymentMethod === "toss"
        ? data.plan.paymentMethod
        : null,
  };
}

function getLegacyMonthKey(data: UserDocLike): string {
  const key = data.usage?.monthly?.key;
  return typeof key === "string" && /^\d{4}-\d{2}$/.test(key)
    ? key
    : getMonthKeyKst();
}

function getFallbackModelLimit(
  data: UserDocLike,
  planTier: PlanId,
  model: QuotaModel
): number {
  const planLimit = model === "flash" ? PLANS[planTier].flashLimit : PLANS[planTier].proLimit;
  const legacyMonthlyLimit = data.quota?.monthlyLimit;

  if (isPositiveNumber(legacyMonthlyLimit)) {
    return Math.max(planLimit, Math.floor(legacyMonthlyLimit));
  }
  return planLimit;
}

function normalizeCreditArray(entries: CreditEntry[] | undefined, now: Date): {
  list: CreditEntry[];
  changed: boolean;
} {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { list: [], changed: Array.isArray(entries) && entries.length > 0 };
  }

  let changed = false;
  const nowMs = now.getTime();
  const list: CreditEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      changed = true;
      continue;
    }

    const remaining = toNonNegativeInt(entry.remaining, 0);
    const purchasedAt =
      typeof entry.purchasedAt === "string" ? entry.purchasedAt : now.toISOString();
    const expiresAt =
      typeof entry.expiresAt === "string" ? entry.expiresAt : now.toISOString();
    const expiresMs = new Date(expiresAt).getTime();

    if (!Number.isFinite(expiresMs) || expiresMs <= nowMs || remaining <= 0) {
      changed = true;
      continue;
    }

    const normalized: CreditEntry = { remaining, purchasedAt, expiresAt };
    if (
      normalized.remaining !== entry.remaining ||
      normalized.purchasedAt !== entry.purchasedAt ||
      normalized.expiresAt !== entry.expiresAt
    ) {
      changed = true;
    }
    list.push(normalized);
  }

  list.sort((a, b) => {
    const aMs = new Date(a.purchasedAt).getTime();
    const bMs = new Date(b.purchasedAt).getTime();
    return aMs - bMs;
  });

  return { list, changed };
}

function normalizeModelQuota(
  raw:
    | {
        monthlyLimit?: number;
        used?: number;
        monthKeyKst?: string;
      }
    | undefined,
  fallbackLimit: number,
  monthKeyKst: string,
  legacyUsed: number
): { quota: UserQuota["flash"]; changed: boolean } {
  const rawLimit = toNonNegativeInt(raw?.monthlyLimit, fallbackLimit);
  const monthlyLimit = rawLimit > 0 ? rawLimit : fallbackLimit;
  const rawKey = raw?.monthKeyKst;
  const isSameMonth = rawKey === monthKeyKst;
  const usedFromRaw = toNonNegativeInt(raw?.used, 0);
  const used = Math.min(
    monthlyLimit,
    isSameMonth ? usedFromRaw : Math.max(0, legacyUsed)
  );

  const changed =
    raw == null ||
    raw.monthlyLimit !== monthlyLimit ||
    raw.monthKeyKst !== monthKeyKst ||
    raw.used !== used;

  return {
    quota: {
      monthlyLimit,
      used,
      monthKeyKst,
    },
    changed,
  };
}

function normalizeUserState(data: UserDocLike, now: Date): NormalizedUserState {
  const monthKeyKst = getMonthKeyKst(now);
  const legacyMonth = getLegacyMonthKey(data);
  const legacyMonthlyCount =
    legacyMonth === monthKeyKst
      ? toNonNegativeInt(data.usage?.monthly?.count, 0)
      : 0;
  const plan = resolvePlan(data);
  const planTier = plan.tier;
  const fallbackStorageLimit = PLANS[planTier].storageLimit;

  const flashLimitFallback = getFallbackModelLimit(data, planTier, "flash");
  const proLimitFallback = getFallbackModelLimit(data, planTier, "pro");

  const normalizedFlash = normalizeModelQuota(
    data.quota?.flash,
    flashLimitFallback,
    monthKeyKst,
    legacyMonthlyCount
  );
  const normalizedPro = normalizeModelQuota(
    data.quota?.pro,
    proLimitFallback,
    monthKeyKst,
    legacyMonthlyCount
  );

  const rawStorageLimit = data.quota?.storageLimit;
  const storageLimit =
    rawStorageLimit === null
      ? null
      : toNonNegativeInt(rawStorageLimit, fallbackStorageLimit ?? 0);
  const normalizedStorageLimit =
    storageLimit === 0 && fallbackStorageLimit === null ? null : storageLimit;
  const storageUsed = toNonNegativeInt(data.quota?.storageUsed, 0);

  const flashCredits = normalizeCreditArray(data.credits?.flash, now);
  const proCredits = normalizeCreditArray(data.credits?.pro, now);

  const legacyDailyKey =
    typeof data.usage?.daily?.key === "string"
      ? data.usage?.daily.key
      : now.toISOString().slice(0, 10);
  const legacyDailyCount = toNonNegativeInt(data.usage?.daily?.count, 0);
  const legacyMonthlyKey =
    typeof data.usage?.monthly?.key === "string"
      ? data.usage?.monthly.key
      : monthKeyKst;
  const legacyMonthlyCountNormalized = toNonNegativeInt(
    data.usage?.monthly?.count,
    0
  );

  const needsPersist =
    !data.plan ||
    !data.quota ||
    normalizedFlash.changed ||
    normalizedPro.changed ||
    rawStorageLimit !== normalizedStorageLimit ||
    data.quota?.storageUsed !== storageUsed ||
    !data.credits ||
    flashCredits.changed ||
    proCredits.changed ||
    data.usage?.daily?.key !== legacyDailyKey ||
    data.usage?.daily?.count !== legacyDailyCount ||
    data.usage?.monthly?.key !== legacyMonthlyKey ||
    data.usage?.monthly?.count !== legacyMonthlyCountNormalized;

  return {
    plan,
    quota: {
      flash: normalizedFlash.quota,
      pro: normalizedPro.quota,
      storageLimit: normalizedStorageLimit,
      storageUsed,
    },
    credits: {
      flash: flashCredits.list,
      pro: proCredits.list,
    },
    legacyUsageDaily: {
      key: legacyDailyKey,
      count: legacyDailyCount,
    },
    legacyUsageMonthly: {
      key: legacyMonthlyKey,
      count: legacyMonthlyCountNormalized,
    },
    needsPersist,
  };
}

function sumCredits(entries: CreditEntry[]): number {
  return entries.reduce((sum, entry) => sum + toNonNegativeInt(entry.remaining, 0), 0);
}

function buildQuotaStatus(state: NormalizedUserState): QuotaStatus {
  const flashCredits = sumCredits(state.credits.flash);
  const proCredits = sumCredits(state.credits.pro);
  const flashRemaining =
    Math.max(0, state.quota.flash.monthlyLimit - state.quota.flash.used) + flashCredits;
  const proRemaining =
    Math.max(0, state.quota.pro.monthlyLimit - state.quota.pro.used) + proCredits;
  const storageRemaining =
    state.quota.storageLimit === null
      ? null
      : Math.max(0, state.quota.storageLimit - state.quota.storageUsed);

  return {
    plan: state.plan.tier,
    monthKeyKst: state.quota.flash.monthKeyKst,
    flash: {
      limit: state.quota.flash.monthlyLimit,
      used: state.quota.flash.used,
      remaining: flashRemaining,
      credits: flashCredits,
    },
    pro: {
      limit: state.quota.pro.monthlyLimit,
      used: state.quota.pro.used,
      remaining: proRemaining,
      credits: proCredits,
    },
    storage: {
      limit: state.quota.storageLimit,
      used: state.quota.storageUsed,
      remaining: storageRemaining,
    },
    canGenerate: flashRemaining > 0 || proRemaining > 0,
    canGenerateByModel: {
      flash: flashRemaining > 0,
      pro: proRemaining > 0,
    },
  };
}

function consumeCredits(entries: CreditEntry[], need: number): {
  updated: CreditEntry[];
  consumed: number;
} {
  if (need <= 0) {
    return { updated: entries, consumed: 0 };
  }

  let remainingNeed = need;
  const updated: CreditEntry[] = [];

  for (const entry of entries) {
    if (remainingNeed <= 0) {
      updated.push(entry);
      continue;
    }

    const available = toNonNegativeInt(entry.remaining, 0);
    if (available <= 0) {
      continue;
    }

    const take = Math.min(available, remainingNeed);
    const nextRemaining = available - take;
    remainingNeed -= take;

    if (nextRemaining > 0) {
      updated.push({
        ...entry,
        remaining: nextRemaining,
      });
    }
  }

  return {
    updated,
    consumed: need - remainingNeed,
  };
}

function assertCanConsume(
  state: NormalizedUserState,
  model: QuotaModel,
  amount: number
): void {
  if (amount <= 0) return;
  const quota = state.quota[model];
  const credits = state.credits[model];
  const available =
    Math.max(0, quota.monthlyLimit - quota.used) + sumCredits(credits);

  if (available < amount) {
    throw new QuotaExceededError(model, amount, available);
  }
}

function buildPersistPayload(state: NormalizedUserState) {
  return {
    plan: state.plan,
    quota: {
      ...state.quota,
      // Legacy compatibility fields (P1 migration 이전 경로 보호)
      dailyLimit: DEFAULT_QUOTA.dailyLimit,
      monthlyLimit: Math.max(
        state.quota.flash.monthlyLimit,
        state.quota.pro.monthlyLimit
      ),
    },
    credits: state.credits,
    usage: {
      daily: state.legacyUsageDaily,
      monthly: state.legacyUsageMonthly,
    },
    updatedAt: FieldValue.serverTimestamp(),
  };
}

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
