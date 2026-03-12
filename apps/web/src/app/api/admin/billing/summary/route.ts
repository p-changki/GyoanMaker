export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getDb } from "@/lib/firebase-admin";
import { getMonthKeyKst } from "@gyoanmaker/shared/plans";

function getMonthStartIso(): string {
  const now = new Date();
  const kstKey = getMonthKeyKst(now);
  const [year, month] = kstKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  start.setHours(start.getHours() - 9);
  return start.toISOString();
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getDb();
    const monthStart = getMonthStartIso();

    // Single-field range queries (no composite index needed), filter status in memory
    const [billingSnap, pendingSnap] = await Promise.all([
      db
        .collection("billing_orders")
        .where("confirmedAt", ">=", monthStart)
        .get(),
      db
        .collection("pending_orders")
        .where("createdAt", ">=", monthStart)
        .get(),
    ]);

    let monthlyRevenue = 0;
    let monthlyOrderCount = 0;
    billingSnap.forEach((doc) => {
      const data = doc.data();
      if (data.status !== "confirmed") return;
      monthlyOrderCount++;
      monthlyRevenue += typeof data.confirmedAmount === "number"
        ? data.confirmedAmount
        : typeof data.amount === "number"
          ? data.amount
          : 0;
    });

    let pendingCount = 0;
    let paidNotAppliedCount = 0;
    let failedCount = 0;
    pendingSnap.forEach((doc) => {
      const status = doc.data().status;
      if (status === "pending") pendingCount++;
      else if (status === "paid_not_applied") paidNotAppliedCount++;
      else if (status === "failed") failedCount++;
    });

    return NextResponse.json({
      monthlyRevenue,
      monthlyOrderCount,
      pendingCount,
      paidNotAppliedCount,
      failedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/summary] ${message}`);
    return NextResponse.json(
      { error: { code: "BILLING_SUMMARY_ERROR", message } },
      { status: 500 }
    );
  }
}
