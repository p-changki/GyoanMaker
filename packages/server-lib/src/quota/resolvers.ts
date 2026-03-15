import { FieldValue } from "firebase-admin/firestore";
import {
  getMonthKeyKst,
  type PlanId,
  PLANS,
  type QuotaModel,
} from "@gyoanmaker/shared/plans";
import type { CreditEntry, CreditStatus, UserPlan, UserQuota } from "@gyoanmaker/shared/types";
import {
  DEFAULT_PLAN,
  DEFAULT_QUOTA,
  type NormalizedUserState,
  QuotaExceededError,
  type QuotaStatus,
  type UserDocLike,
} from "./types";

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
    data.plan?.status === "active" || data.plan?.status === "expired"
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
  };
}

function getLegacyMonthKey(data: UserDocLike): string {
  const key = data.usage?.monthly?.key;
  return typeof key === "string" && /^\d{4}-\d{2}$/.test(key)
    ? key
    : getMonthKeyKst();
}

function getFallbackModelLimit(
  _data: UserDocLike,
  planTier: PlanId,
  model: QuotaModel
): number {
  return model === "flash" ? PLANS[planTier].flashLimit : PLANS[planTier].proLimit;
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
  const nowIso = now.toISOString();
  const list: CreditEntry[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      changed = true;
      continue;
    }

    const remaining = toNonNegativeInt(entry.remaining, 0);
    const purchasedAt =
      typeof entry.purchasedAt === "string" ? entry.purchasedAt : nowIso;
    const expiresAt =
      typeof entry.expiresAt === "string" ? entry.expiresAt : nowIso;
    const expiresMs = new Date(expiresAt).getTime();

    // Drop entries with unparseable expiry (corrupt data)
    if (!Number.isFinite(expiresMs)) {
      changed = true;
      continue;
    }

    const total =
      typeof entry.total === "number" && Number.isFinite(entry.total) && entry.total > 0
        ? entry.total
        : undefined;
    const orderId = typeof entry.orderId === "string" && entry.orderId ? entry.orderId : undefined;

    // Determine status — preserve existing exhausted/expired status, set new one if needed
    let status: CreditStatus | undefined = entry.status;
    let exhaustedAt: string | undefined =
      typeof entry.exhaustedAt === "string" ? entry.exhaustedAt : undefined;
    let expiredAt: string | undefined =
      typeof entry.expiredAt === "string" ? entry.expiredAt : undefined;

    if (remaining <= 0 && (!status || status === "active")) {
      status = "exhausted";
      exhaustedAt = exhaustedAt ?? nowIso;
    } else if (expiresMs <= nowMs && (!status || status === "active")) {
      status = "expired";
      expiredAt = expiredAt ?? nowIso;
    }

    const normalized: CreditEntry = {
      remaining,
      purchasedAt,
      expiresAt,
      ...(total !== undefined ? { total } : {}),
      ...(orderId !== undefined ? { orderId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(exhaustedAt !== undefined ? { exhaustedAt } : {}),
      ...(expiredAt !== undefined ? { expiredAt } : {}),
    };

    if (
      normalized.remaining !== entry.remaining ||
      normalized.purchasedAt !== entry.purchasedAt ||
      normalized.expiresAt !== entry.expiresAt ||
      normalized.total !== entry.total ||
      normalized.orderId !== entry.orderId ||
      normalized.status !== entry.status ||
      normalized.exhaustedAt !== entry.exhaustedAt ||
      normalized.expiredAt !== entry.expiredAt
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
  periodKey: string,
  legacyUsed: number
): { quota: UserQuota["flash"]; changed: boolean } {
  const rawLimit = toNonNegativeInt(raw?.monthlyLimit, fallbackLimit);
  const monthlyLimit = Math.max(rawLimit, fallbackLimit);
  const rawKey = raw?.monthKeyKst;
  const isSamePeriod = rawKey === periodKey;
  const usedFromRaw = toNonNegativeInt(raw?.used, 0);
  const used = Math.min(
    monthlyLimit,
    isSamePeriod ? usedFromRaw : Math.max(0, legacyUsed)
  );

  const changed =
    raw == null ||
    raw.monthlyLimit !== monthlyLimit ||
    raw.monthKeyKst !== periodKey ||
    raw.used !== used;

  return {
    quota: {
      monthlyLimit,
      used,
      monthKeyKst: periodKey,
    },
    changed,
  };
}

function resolveMonthlyLimits(
  data: UserDocLike,
  planTier: PlanId,
  periodKey: string,
  legacyMonthlyCount: number
) {
  const flashLimitFallback = getFallbackModelLimit(data, planTier, "flash");
  const proLimitFallback = getFallbackModelLimit(data, planTier, "pro");
  const illustrationLimitFallback = PLANS[planTier].illustrationMonthlyLimit;

  return {
    flash: normalizeModelQuota(
      data.quota?.flash,
      flashLimitFallback,
      periodKey,
      legacyMonthlyCount
    ),
    pro: normalizeModelQuota(
      data.quota?.pro,
      proLimitFallback,
      periodKey,
      legacyMonthlyCount
    ),
    illustration: normalizeModelQuota(
      data.quota?.illustration,
      illustrationLimitFallback,
      periodKey,
      0
    ),
  };
}

/**
 * Derive the period key for quota resets.
 * - Free users: calendar month (e.g. "2026-03") — resets on the 1st
 * - Paid users: subscription start date (e.g. "2026-03-07") — resets on renewal
 */
function derivePeriodKey(plan: UserPlan, now: Date): string {
  if (plan.tier === "free") {
    return getMonthKeyKst(now);
  }
  return plan.currentPeriodStartAt.slice(0, 10);
}

export function normalizeUserState(
  data: UserDocLike,
  now: Date
): NormalizedUserState {
  const calendarMonthKey = getMonthKeyKst(now);
  const plan = resolveUserPlan(data);
  const planTier = plan.tier;
  const periodKey = derivePeriodKey(plan, now);

  const legacyMonth = getLegacyMonthKey(data);
  const legacyMonthlyCount =
    legacyMonth === calendarMonthKey
      ? toNonNegativeInt(data.usage?.monthly?.count, 0)
      : 0;

  const fallbackStorageLimit = PLANS[planTier].storageLimit;
  const normalizedMonthly = resolveMonthlyLimits(
    data,
    planTier,
    periodKey,
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
  const illustrationCredits = normalizeCreditArray(data.credits?.illustration, now);

  const legacyDailyKey =
    typeof data.usage?.daily?.key === "string"
      ? data.usage?.daily.key
      : now.toISOString().slice(0, 10);
  const legacyDailyCount = toNonNegativeInt(data.usage?.daily?.count, 0);
  const legacyMonthlyKey =
    typeof data.usage?.monthly?.key === "string"
      ? data.usage?.monthly.key
      : calendarMonthKey;
  const legacyMonthlyCountNormalized = toNonNegativeInt(
    data.usage?.monthly?.count,
    0
  );

  const needsPersist =
    !data.plan ||
    !data.quota ||
    normalizedMonthly.flash.changed ||
    normalizedMonthly.pro.changed ||
    normalizedMonthly.illustration.changed ||
    rawStorageLimit !== normalizedStorageLimit ||
    data.quota?.storageUsed !== storageUsed ||
    !data.credits ||
    flashCredits.changed ||
    proCredits.changed ||
    illustrationCredits.changed ||
    data.usage?.daily?.key !== legacyDailyKey ||
    data.usage?.daily?.count !== legacyDailyCount ||
    data.usage?.monthly?.key !== legacyMonthlyKey ||
    data.usage?.monthly?.count !== legacyMonthlyCountNormalized;

  return {
    plan,
    quota: {
      flash: normalizedMonthly.flash.quota,
      pro: normalizedMonthly.pro.quota,
      illustration: normalizedMonthly.illustration.quota,
      storageLimit: normalizedStorageLimit,
      storageUsed,
    },
    credits: {
      flash: flashCredits.list,
      pro: proCredits.list,
      illustration: illustrationCredits.list,
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
  return entries
    .filter((e) => !e.status || e.status === "active")
    .reduce((sum, entry) => sum + toNonNegativeInt(entry.remaining, 0), 0);
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

  const illustrationCredits = sumCredits(state.credits.illustration);
  const illustrationRemaining =
    Math.max(0, state.quota.illustration.monthlyLimit - state.quota.illustration.used) +
    illustrationCredits;

  return {
    plan: state.plan.tier,
    monthKeyKst: state.quota.flash.monthKeyKst,
    flash: {
      limit: state.quota.flash.monthlyLimit,
      used: state.quota.flash.used,
      remaining: flashRemaining,
      credits: flashCredits,
      creditEntries: state.credits.flash,
    },
    pro: {
      limit: state.quota.pro.monthlyLimit,
      used: state.quota.pro.used,
      remaining: proRemaining,
      credits: proCredits,
      creditEntries: state.credits.pro,
    },
    storage: {
      limit: state.quota.storageLimit,
      used: state.quota.storageUsed,
      remaining: storageRemaining,
    },
    illustration: {
      limit: state.quota.illustration.monthlyLimit,
      used: state.quota.illustration.used,
      remaining: illustrationRemaining,
      credits: illustrationCredits,
      creditEntries: state.credits.illustration,
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
  const nowIso = new Date().toISOString();

  for (const entry of entries) {
    if (remainingNeed <= 0) {
      updated.push(entry);
      continue;
    }

    // Skip non-active entries (expired, exhausted)
    if (entry.status && entry.status !== "active") {
      updated.push(entry);
      continue;
    }

    const available = toNonNegativeInt(entry.remaining, 0);
    if (available <= 0) {
      // Preserve already-exhausted/expired entries in history
      updated.push(entry);
      continue;
    }

    const take = Math.min(available, remainingNeed);
    const nextRemaining = available - take;
    remainingNeed -= take;

    if (nextRemaining > 0) {
      updated.push({ ...entry, remaining: nextRemaining });
    } else {
      // Credit fully consumed — mark as exhausted and preserve in history
      updated.push({
        ...entry,
        remaining: 0,
        status: "exhausted",
        exhaustedAt: entry.exhaustedAt ?? nowIso,
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
      dailyLimit: DEFAULT_QUOTA.dailyLimit,
    },
    credits: state.credits,

    usage: {
      daily: state.legacyUsageDaily,
      monthly: state.legacyUsageMonthly,
    },
    updatedAt: FieldValue.serverTimestamp(),
  };
}
