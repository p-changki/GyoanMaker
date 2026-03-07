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

    const [confirmedSnap, pendingSnap, paidNotAppliedSnap, failedSnap] =
      await Promise.all([
        db
          .collection("billing_orders")
          .where("status", "==", "confirmed")
          .where("confirmedAt", ">=", monthStart)
          .get(),
        db
          .collection("pending_orders")
          .where("status", "==", "pending")
          .get(),
        db
          .collection("pending_orders")
          .where("status", "==", "paid_not_applied")
          .get(),
        db
          .collection("pending_orders")
          .where("status", "==", "failed")
          .get(),
      ]);

    let monthlyRevenue = 0;
    confirmedSnap.forEach((doc) => {
      const data = doc.data();
      monthlyRevenue += typeof data.confirmedAmount === "number"
        ? data.confirmedAmount
        : typeof data.amount === "number"
          ? data.amount
          : 0;
    });

    return NextResponse.json({
      monthlyRevenue,
      monthlyOrderCount: confirmedSnap.size,
      pendingCount: pendingSnap.size,
      paidNotAppliedCount: paidNotAppliedSnap.size,
      failedCount: failedSnap.size,
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
