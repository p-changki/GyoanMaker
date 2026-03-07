import { FieldValue } from "firebase-admin/firestore";
import {
  getMonthKeyKst,
  type PlanId,
  PLANS,
  type QuotaModel,
} from "@gyoanmaker/shared/plans";
import type { CreditEntry, UserPlan, UserQuota } from "@gyoanmaker/shared/types";
import {
  DEFAULT_PLAN,
  DEFAULT_QUOTA,
  type NormalizedUserState,
  QuotaExceededError,
  type QuotaStatus,
  type UserDocLike,
} from "./types";

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function toNonNegativeInt(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

export function resolveUserPlan(data: UserDocLike): UserPlan {
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

function resolveMonthlyLimits(
  data: UserDocLike,
  planTier: PlanId,
  monthKeyKst: string,
  legacyMonthlyCount: number
) {
  const flashLimitFallback = getFallbackModelLimit(data, planTier, "flash");
  const proLimitFallback = getFallbackModelLimit(data, planTier, "pro");

  return {
    flash: normalizeModelQuota(
      data.quota?.flash,
      flashLimitFallback,
      monthKeyKst,
      legacyMonthlyCount
    ),
    pro: normalizeModelQuota(
      data.quota?.pro,
      proLimitFallback,
      monthKeyKst,
      legacyMonthlyCount
    ),
  };
}

export function normalizeUserState(
  data: UserDocLike,
  now: Date
): NormalizedUserState {
  const monthKeyKst = getMonthKeyKst(now);
  const legacyMonth = getLegacyMonthKey(data);
  const legacyMonthlyCount =
    legacyMonth === monthKeyKst
      ? toNonNegativeInt(data.usage?.monthly?.count, 0)
      : 0;
  const plan = resolveUserPlan(data);
  const planTier = plan.tier;
  const fallbackStorageLimit = PLANS[planTier].storageLimit;
  const normalizedMonthly = resolveMonthlyLimits(
    data,
    planTier,
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
    normalizedMonthly.flash.changed ||
    normalizedMonthly.pro.changed ||
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
      flash: normalizedMonthly.flash.quota,
      pro: normalizedMonthly.pro.quota,
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

export function buildQuotaStatus(state: NormalizedUserState): QuotaStatus {
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

export function consumeCredits(entries: CreditEntry[], need: number): {
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

export function assertCanConsume(
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

export function buildPersistPayload(state: NormalizedUserState) {
  return {
    plan: state.plan,
    quota: {
      ...state.quota,
      // Legacy compatibility fields (P1 migration legacy path protection)
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
