export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getDb } from "@/lib/firebase-admin";

const VALID_STATUSES = new Set([
  "pending",
  "confirmed",
  "failed",
  "paid_not_applied",
]);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") ?? "all";
  const limitParam = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(Math.max(1, limitParam), 200);

  try {
    const db = getDb();
    let query = db
      .collection("pending_orders")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (statusFilter !== "all" && VALID_STATUSES.has(statusFilter)) {
      query = db
        .collection("pending_orders")
        .where("status", "==", statusFilter)
        .orderBy("createdAt", "desc")
        .limit(limit);
    }

    const snap = await query.get();
    const orders = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        orderId: doc.id,
        email: d.email ?? "",
        type: d.type ?? "subscription",
        planId: d.planId ?? null,
        packageId: d.packageId ?? null,
        amount: typeof d.amount === "number" ? d.amount : 0,
        status: d.status ?? "pending",
        createdAt: d.createdAt ?? "",
        confirmedAt: d.confirmedAt ?? null,
        failedAt: d.failedAt ?? null,
        paidNotAppliedAt: d.paidNotAppliedAt ?? null,
        paymentKey: d.paymentKey ?? null,
        errorMessage: d.errorMessage ?? null,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/orders] ${message}`);
    return NextResponse.json(
      { error: { code: "BILLING_ORDERS_ERROR", message } },
      { status: 500 }
    );
  }
}
