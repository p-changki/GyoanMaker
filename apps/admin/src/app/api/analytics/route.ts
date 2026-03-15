export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";
import { estimateCostUsd } from "@gyoanmaker/server-lib/usageLog";
import { getMonthKeyKst, PLANS } from "@gyoanmaker/shared/plans";
import { AggregateField } from "firebase-admin/firestore";

// ── Helpers ───────────────────────────────────────────────────────────────────

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Returns the start of KST today as a UTC ISO string */
function getTodayKstIso(): string {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  // Midnight KST = UTC midnight minus 9h
  const kstMidnight = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
  );
  return new Date(kstMidnight.getTime() - KST_OFFSET_MS).toISOString();
}

function getMonthsAgoIso(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getDaysAgoIso(n: number): string {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCDate(kstNow.getUTCDate() - n);
  const kstMidnight = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
  );
  return new Date(kstMidnight.getTime() - KST_OFFSET_MS).toISOString();
}

function toMonthLabel(iso: string): string {
  const parts = iso.slice(0, 7).split("-");
  return `${parts[0]?.slice(2)}/${parts[1]}`;
}

function toDayLabel(iso: string): string {
  // Use KST date to be consistent with KPI calculations
  const kstIso = new Date(new Date(iso).getTime() + KST_OFFSET_MS).toISOString();
  return kstIso.slice(5, 10); // "MM-DD" in KST
}

function extractDomain(email: string): string {
  const at = email.indexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "unknown";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  planDistribution: { tier: string; count: number; pct: number }[];
  topUsers: { email: string; requests: number; tokens: number; plan: string }[];
  modelStats: { model: string; requests: number; pct: number }[];
  levelStats: { level: string; requests: number; pct: number }[];
  revenueTrend: { month: string; revenue: number; orders: number }[];
  usageTrend: { month: string; requests: number; passages: number }[];
  dailyRevenue: { day: string; revenue: number; orders: number }[];
  dailyUsage: { day: string; requests: number }[];
  newUserTrend: { month: string; count: number }[];
  paymentMethodStats: { method: string; count: number; revenue: number; pct: number }[];
  emailDomainStats: { domain: string; count: number; pct: number }[];
  inactiveUsers: { email: string; plan: string; daysSinceJoin: number }[];
  summary: {
    totalUsers: number;
    approvedUsers: number;
    totalRevenueAllTime: number;
    totalRevenueThisMonth: number;
    totalRevenueToday: number;
    totalRequestsThisMonth: number;
    totalRequestsToday: number;
    estimatedCostThisMonthUsd: number;
    mrr: number;
    avgPassagesPerRequest: number;
    inactiveUserCount: number;
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();

  const sixMonthsAgo = getMonthsAgoIso(6);
  const thirtyDaysAgo = getDaysAgoIso(30);
  const todayIso = getTodayKstIso();
  const thisMonthKey = getMonthKeyKst();
  const thisMonthStart = `${thisMonthKey}-01T00:00:00.000Z`;

  try {
    const allRevenueAggQuery = db
      .collection("billing_orders")
      .where("status", "==", "confirmed")
      .aggregate({ totalAmount: AggregateField.sum("amount") });

    const [usersSnap, usageSnap, revenueSnap, topUsersSnap, allRevenueAgg] = await Promise.all([
      db.collection("users").get(),
      db.collection("usage_logs").where("createdAt", ">=", new Date(sixMonthsAgo)).get(),
      db.collection("billing_orders").where("status", "==", "confirmed").where("confirmedAt", ">=", sixMonthsAgo).get(),
      db.collection("usage_logs").where("createdAt", ">=", new Date(thirtyDaysAgo)).get(),
      allRevenueAggQuery.get(),
    ]);

    // ── 1. Plan distribution + MRR ────────────────────
    const planCounts: Record<string, number> = { free: 0, basic: 0, standard: 0, pro: 0 };
    let approvedCount = 0;
    let mrr = 0;

    // Track active emails for inactive detection
    const activeEmailsLast30: Set<string> = new Set();
    topUsersSnap.forEach((doc) => {
      const email = doc.data().email as string | undefined;
      if (email) activeEmailsLast30.add(email.toLowerCase());
    });

    // User data map for multiple lookups
    interface UserEntry {
      plan: string;
      status: string;
      createdAt: string;
      email: string;
    }
    const userEntries: UserEntry[] = [];

    usersSnap.forEach((doc) => {
      const d = doc.data();
      const tier = (d.plan?.tier ?? "free") as string;
      const status = (d.status ?? "pending") as string;
      const createdAt = (d.createdAt ?? "") as string;
      const email = doc.id;

      planCounts[tier] = (planCounts[tier] ?? 0) + 1;
      if (status === "approved") {
        approvedCount++;
        mrr += PLANS[tier as keyof typeof PLANS]?.price ?? 0;
      }

      userEntries.push({ plan: tier, status, createdAt, email });
    });

    const totalUsers = usersSnap.size;
    const planDistribution = Object.entries(planCounts).map(([tier, count]) => ({
      tier,
      count,
      pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
    }));

    // ── 2. Model + level stats (last 30 days) ─────────
    const modelCounts: Record<string, number> = {};
    const levelCounts: Record<string, number> = {};
    let totalPassages30 = 0;
    const userMap: Record<string, { requests: number; tokens: number }> = {};

    topUsersSnap.forEach((doc) => {
      const d = doc.data();
      const model = (d.model ?? "unknown") as string;
      const level = (d.level ?? "unknown") as string;
      const email = (d.email ?? "unknown") as string;

      modelCounts[model] = (modelCounts[model] ?? 0) + 1;
      levelCounts[level] = (levelCounts[level] ?? 0) + 1;
      totalPassages30 += d.passageCount ?? 0;

      if (!userMap[email]) userMap[email] = { requests: 0, tokens: 0 };
      userMap[email].requests++;
      userMap[email].tokens += d.totalTokens ?? 0;
    });

    const totalModelReqs = Object.values(modelCounts).reduce((a, b) => a + b, 0);
    const modelStats = Object.entries(modelCounts)
      .map(([model, requests]) => ({
        model,
        requests,
        pct: totalModelReqs > 0 ? Math.round((requests / totalModelReqs) * 100) : 0,
      }))
      .sort((a, b) => b.requests - a.requests);

    const totalLevelReqs = Object.values(levelCounts).reduce((a, b) => a + b, 0);
    const levelStats = Object.entries(levelCounts)
      .map(([level, requests]) => ({
        level,
        requests,
        pct: totalLevelReqs > 0 ? Math.round((requests / totalLevelReqs) * 100) : 0,
      }))
      .sort((a, b) => b.requests - a.requests);

    const avgPassagesPerRequest =
      totalModelReqs > 0 ? Math.round((totalPassages30 / totalModelReqs) * 10) / 10 : 0;

    // Build plan lookup
    const userPlanMap: Record<string, string> = {};
    userEntries.forEach((u) => { userPlanMap[u.email] = u.plan; });

    const topUsers = Object.entries(userMap)
      .map(([email, stats]) => ({
        email,
        requests: stats.requests,
        tokens: stats.tokens,
        plan: userPlanMap[email] ?? "free",
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 15);

    // ── 3. Monthly trends ─────────────────────────────
    const revenueByMonth: Record<string, { revenue: number; orders: number }> = {};
    const usageByMonth: Record<string, { requests: number; passages: number }> = {};
    const newUserByMonth: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = toMonthLabel(d.toISOString());
      revenueByMonth[key] = { revenue: 0, orders: 0 };
      usageByMonth[key] = { requests: 0, passages: 0 };
      newUserByMonth[key] = 0;
    }

    revenueSnap.forEach((doc) => {
      const d = doc.data();
      const confirmedAt = typeof d.confirmedAt === "string" ? d.confirmedAt : "";
      if (!confirmedAt) return;
      const key = toMonthLabel(confirmedAt);
      if (revenueByMonth[key]) {
        revenueByMonth[key].revenue += typeof d.amount === "number" ? d.amount : 0;
        revenueByMonth[key].orders++;
      }
    });

    usageSnap.forEach((doc) => {
      const d = doc.data();
      const createdAt = (d.createdAt?.toDate?.()?.toISOString?.() ?? "") as string;
      if (!createdAt) return;
      const key = toMonthLabel(createdAt);
      if (usageByMonth[key]) {
        usageByMonth[key].requests++;
        usageByMonth[key].passages += (d.passageCount ?? 0) as number;
      }
    });

    userEntries.forEach((u) => {
      if (!u.createdAt) return;
      const key = toMonthLabel(u.createdAt);
      if (key in newUserByMonth) newUserByMonth[key]++;
    });

    const revenueTrend = Object.entries(revenueByMonth).map(([month, v]) => ({ month, ...v }));
    const usageTrend = Object.entries(usageByMonth).map(([month, v]) => ({ month, ...v }));
    const newUserTrend = Object.entries(newUserByMonth).map(([month, count]) => ({ month, count }));

    // ── 4. Daily trends (last 30 days) ────────────────
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
    const usageByDay: Record<string, { requests: number }> = {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDayLabel(d.toISOString());
      revenueByDay[key] = { revenue: 0, orders: 0 };
      usageByDay[key] = { requests: 0 };
    }

    revenueSnap.forEach((doc) => {
      const d = doc.data();
      const confirmedAt = typeof d.confirmedAt === "string" ? d.confirmedAt : "";
      if (!confirmedAt) return;
      const key = toDayLabel(confirmedAt);
      if (revenueByDay[key]) {
        revenueByDay[key].revenue += typeof d.amount === "number" ? d.amount : 0;
        revenueByDay[key].orders++;
      }
    });

    topUsersSnap.forEach((doc) => {
      const d = doc.data();
      const createdAt = (d.createdAt?.toDate?.()?.toISOString?.() ?? "") as string;
      if (!createdAt) return;
      const key = toDayLabel(createdAt);
      if (usageByDay[key]) usageByDay[key].requests++;
    });

    const dailyRevenue = Object.entries(revenueByDay).map(([day, v]) => ({ day, ...v }));
    const dailyUsage = Object.entries(usageByDay).map(([day, v]) => ({ day, ...v }));

    // ── 5. Summary totals ─────────────────────────────
    let totalRevenueAllTime = 0;
    let totalRevenueThisMonth = 0;
    let totalRevenueToday = 0;

    // All-time revenue from aggregate sum (no full scan)
    totalRevenueAllTime = (allRevenueAgg.data().totalAmount as number | null) ?? 0;

    // This month & today from 6-month filtered snap
    revenueSnap.forEach((doc) => {
      const d = doc.data();
      const amt = typeof d.amount === "number" ? d.amount : 0;
      const confirmedAt = typeof d.confirmedAt === "string" ? d.confirmedAt : "";
      if (confirmedAt >= thisMonthStart) totalRevenueThisMonth += amt;
      if (confirmedAt >= todayIso) totalRevenueToday += amt;
    });

    let totalRequestsThisMonth = 0;
    let totalRequestsToday = 0;
    let inputThisMonth = 0;
    let outputThisMonth = 0;

    usageSnap.forEach((doc) => {
      const d = doc.data();
      const createdAt = (d.createdAt?.toDate?.()?.toISOString?.() ?? "") as string;
      if (createdAt >= thisMonthStart) {
        totalRequestsThisMonth++;
        inputThisMonth += (d.inputTokens ?? 0) as number;
        outputThisMonth += (d.outputTokens ?? 0) as number;
      }
      if (createdAt >= todayIso) totalRequestsToday++;
    });

    const estimatedCostThisMonthUsd = estimateCostUsd(inputThisMonth, outputThisMonth);

    // ── 6. Payment method stats ───────────────────────
    const methodMap: Record<string, { count: number; revenue: number }> = {};

    revenueSnap.forEach((doc) => {
      const d = doc.data();
      const flow = (d.checkoutFlow ?? "card") as string;
      const method = flow === "bank_transfer" ? "무통장" : flow === "manual" ? "수동" : "카드";
      if (!methodMap[method]) methodMap[method] = { count: 0, revenue: 0 };
      methodMap[method].count++;
      methodMap[method].revenue += typeof d.amount === "number" ? d.amount : 0;
    });

    const totalMethodOrders = Object.values(methodMap).reduce((a, b) => a + b.count, 0);
    const paymentMethodStats = Object.entries(methodMap)
      .map(([method, v]) => ({
        method,
        count: v.count,
        revenue: v.revenue,
        pct: totalMethodOrders > 0 ? Math.round((v.count / totalMethodOrders) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── 7. Email domain distribution ─────────────────
    const domainMap: Record<string, number> = {};
    userEntries.forEach((u) => {
      const domain = extractDomain(u.email);
      domainMap[domain] = (domainMap[domain] ?? 0) + 1;
    });

    const emailDomainStats = Object.entries(domainMap)
      .map(([domain, count]) => ({
        domain,
        count,
        pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── 8. Inactive users (approved, no activity 30d) ─
    const now = Date.now();
    const inactiveUsers = userEntries
      .filter((u) => u.status === "approved" && !activeEmailsLast30.has(u.email))
      .map((u) => ({
        email: u.email,
        plan: u.plan,
        daysSinceJoin: u.createdAt
          ? Math.floor((now - new Date(u.createdAt).getTime()) / 86_400_000)
          : 0,
      }))
      .sort((a, b) => a.daysSinceJoin - b.daysSinceJoin)
      .slice(0, 20);

    const data: AnalyticsData = {
      planDistribution,
      topUsers,
      modelStats,
      levelStats,
      revenueTrend,
      usageTrend,
      dailyRevenue,
      dailyUsage,
      newUserTrend,
      paymentMethodStats,
      emailDomainStats,
      inactiveUsers,
      summary: {
        totalUsers,
        approvedUsers: approvedCount,
        totalRevenueAllTime,
        totalRevenueThisMonth,
        totalRevenueToday,
        totalRequestsThisMonth,
        totalRequestsToday,
        estimatedCostThisMonthUsd: Math.round(estimatedCostThisMonthUsd * 10000) / 10000,
        mrr,
        avgPassagesPerRequest,
        inactiveUserCount: inactiveUsers.length,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/analytics] ${message}`);
    return NextResponse.json(
      { error: { code: "ANALYTICS_ERROR", message } },
      { status: 500 }
    );
  }
}
