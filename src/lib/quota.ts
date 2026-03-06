import { getDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── Types ──────────────────────────────────────────────

export interface QuotaLimits {
  dailyLimit: number;
  monthlyLimit: number;
}

export interface UsagePeriod {
  count: number;
  key: string; // "YYYY-MM-DD" for daily, "YYYY-MM" for monthly
}

export interface QuotaStatus {
  limits: QuotaLimits;
  daily: UsagePeriod;
  monthly: UsagePeriod;
  canGenerate: boolean;
}

// ── Defaults ───────────────────────────────────────────

const DEFAULT_DAILY_LIMIT = 50;
const DEFAULT_MONTHLY_LIMIT = 500;

export const DEFAULT_QUOTA: QuotaLimits = {
  dailyLimit: DEFAULT_DAILY_LIMIT,
  monthlyLimit: DEFAULT_MONTHLY_LIMIT,
};

// ── Helpers ────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

const COLLECTION = "users";

// ── Read ───────────────────────────────────────────────

export async function getQuotaStatus(email: string): Promise<QuotaStatus> {
  const doc = await getDb()
    .collection(COLLECTION)
    .doc(email.toLowerCase())
    .get();

  const data = doc.data() ?? {};

  const limits: QuotaLimits = {
    dailyLimit: data.quota?.dailyLimit ?? DEFAULT_DAILY_LIMIT,
    monthlyLimit: data.quota?.monthlyLimit ?? DEFAULT_MONTHLY_LIMIT,
  };

  const today = todayKey();
  const month = monthKey();

  // Auto-reset: if stored key differs from current period, count is 0
  const dailyCount =
    data.usage?.daily?.key === today ? (data.usage.daily.count ?? 0) : 0;
  const monthlyCount =
    data.usage?.monthly?.key === month ? (data.usage.monthly.count ?? 0) : 0;

  return {
    limits,
    daily: { count: dailyCount, key: today },
    monthly: { count: monthlyCount, key: month },
    canGenerate:
      dailyCount < limits.dailyLimit && monthlyCount < limits.monthlyLimit,
  };
}

// ── Increment ──────────────────────────────────────────

export async function incrementUsage(
  email: string,
  amount: number = 1
): Promise<QuotaStatus> {
  const key = email.toLowerCase();
  const today = todayKey();
  const month = monthKey();
  const docRef = getDb().collection(COLLECTION).doc(key);

  const result = await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = snap.data() ?? {};

    const limits: QuotaLimits = {
      dailyLimit: data.quota?.dailyLimit ?? DEFAULT_DAILY_LIMIT,
      monthlyLimit: data.quota?.monthlyLimit ?? DEFAULT_MONTHLY_LIMIT,
    };

    // Auto-reset on date boundary
    const prevDailyCount =
      data.usage?.daily?.key === today ? (data.usage.daily.count ?? 0) : 0;
    const prevMonthlyCount =
      data.usage?.monthly?.key === month ? (data.usage.monthly.count ?? 0) : 0;

    if (
      prevDailyCount + amount > limits.dailyLimit ||
      prevMonthlyCount + amount > limits.monthlyLimit
    ) {
      return {
        limits,
        daily: { count: prevDailyCount, key: today },
        monthly: { count: prevMonthlyCount, key: month },
        canGenerate: false,
      } satisfies QuotaStatus;
    }

    const newDailyCount = prevDailyCount + amount;
    const newMonthlyCount = prevMonthlyCount + amount;

    tx.update(docRef, {
      "usage.daily": { count: newDailyCount, key: today },
      "usage.monthly": { count: newMonthlyCount, key: month },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      limits,
      daily: { count: newDailyCount, key: today },
      monthly: { count: newMonthlyCount, key: month },
      canGenerate:
        newDailyCount < limits.dailyLimit &&
        newMonthlyCount < limits.monthlyLimit,
    } satisfies QuotaStatus;
  });

  return result;
}

// ── Admin: Set Limits ──────────────────────────────────

export async function setQuotaLimits(
  email: string,
  limits: Partial<QuotaLimits>
): Promise<void> {
  const key = email.toLowerCase();
  const updates: Record<string, number> = {};

  if (limits.dailyLimit !== undefined) {
    updates["quota.dailyLimit"] = Math.max(1, Math.floor(limits.dailyLimit));
  }
  if (limits.monthlyLimit !== undefined) {
    updates["quota.monthlyLimit"] = Math.max(
      1,
      Math.floor(limits.monthlyLimit)
    );
  }

  if (Object.keys(updates).length === 0) return;

  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

// ── Initialize (for new users) ─────────────────────────

export async function initializeQuota(email: string): Promise<void> {
  const key = email.toLowerCase();
  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .update({
      quota: DEFAULT_QUOTA,
      usage: {
        daily: { count: 0, key: todayKey() },
        monthly: { count: 0, key: monthKey() },
      },
    });
}
