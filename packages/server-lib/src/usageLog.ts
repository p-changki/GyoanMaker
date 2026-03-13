import { getDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── Types ──────────────────────────────────────────────

export interface UsageLogEntry {
  email: string;
  requestId: string;
  passageCount: number;
  model: string;
  level: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface UsageSummary {
  totalRequests: number;
  totalPassages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
}

// ── Constants ──────────────────────────────────────────

const COLLECTION = "usage_logs";

// Gemini 2.5 Pro pricing (USD per 1M tokens, ≤128K context)
export const TOKEN_PRICING = {
  inputPerMillion: 1.25,
  outputPerMillion: 10.0,
} as const;

// ── Write ──────────────────────────────────────────────

/**
 * Record a usage log entry in Firestore.
 */
export async function logUsage(entry: UsageLogEntry): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).add({
    ...entry,
    createdAt: FieldValue.serverTimestamp(),
  });
}

// ── Read ───────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

/**
 * Get aggregated usage summary for a period.
 * - period "daily": today's logs
 * - period "monthly": this month's logs
 * - email: optional filter by user
 */
export async function getUsageSummary(
  period: "daily" | "monthly",
  email?: string
): Promise<UsageSummary> {
  const db = getDb();
  const key = period === "daily" ? todayKey() : monthKey();

  // Query by date range
  const startDate =
    period === "daily" ? `${key}T00:00:00.000Z` : `${key}-01T00:00:00.000Z`;

  let query = db
    .collection(COLLECTION)
    .where("createdAt", ">=", new Date(startDate));

  if (email) {
    query = query.where("email", "==", email);
  }

  const snap = await query.get();

  const summary: UsageSummary = {
    totalRequests: 0,
    totalPassages: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
  };

  for (const doc of snap.docs) {
    const data = doc.data();
    summary.totalRequests += 1;
    summary.totalPassages += data.passageCount ?? 0;
    summary.totalInputTokens += data.inputTokens ?? 0;
    summary.totalOutputTokens += data.outputTokens ?? 0;
    summary.totalTokens += data.totalTokens ?? 0;
  }

  return summary;
}

/**
 * Estimate cost in USD from token counts.
 */
export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * TOKEN_PRICING.inputPerMillion +
    (outputTokens / 1_000_000) * TOKEN_PRICING.outputPerMillion
  );
}

// ── User Usage Logs ────────────────────────────────────

export interface UsageLogRow {
  requestId: string;
  model: string;
  level: string;
  passageCount: number;
  totalTokens: number;
  createdAt: string;
}

interface RawUsageLog {
  requestId?: string;
  model?: string;
  level?: string;
  passageCount?: number;
  totalTokens?: number;
  createdAt?: { toDate?: () => Date } | string;
}

function toIsoFromTimestamp(
  value: { toDate?: () => Date } | string | undefined
): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

export interface UserUsageLogsResult {
  logs: UsageLogRow[];
  summary: { totalRequests: number; totalPassages: number };
}

export async function getUserUsageLogs(
  email: string,
  limit: number
): Promise<UserUsageLogsResult> {
  const key = email.toLowerCase();
  const db = getDb();

  const snap = await db
    .collection(COLLECTION)
    .where("email", "==", key)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  let totalPassages = 0;
  const logs: UsageLogRow[] = snap.docs.map((doc) => {
    const data = doc.data() as RawUsageLog;
    const passageCount =
      typeof data.passageCount === "number" ? data.passageCount : 0;
    totalPassages += passageCount;

    return {
      requestId: data.requestId ?? doc.id,
      model: typeof data.model === "string" ? data.model : "unknown",
      level: typeof data.level === "string" ? data.level : "unknown",
      passageCount,
      totalTokens:
        typeof data.totalTokens === "number" ? data.totalTokens : 0,
      createdAt: toIsoFromTimestamp(data.createdAt),
    };
  });

  return {
    logs,
    summary: { totalRequests: logs.length, totalPassages },
  };
}
