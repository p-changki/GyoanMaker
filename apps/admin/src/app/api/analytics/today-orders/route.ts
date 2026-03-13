export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";

export interface TodayOrder {
  orderId: string;
  email: string;
  amount: number;
  orderType: string;
  planTier: string | null;
  confirmedAt: string;
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = getDb();
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const now = new Date();
    const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
    const kstMidnight = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate())
    );
    const todayIso = new Date(kstMidnight.getTime() - KST_OFFSET_MS).toISOString();

    // Single-field range query (no composite index needed), filter status in memory
    const snap = await db
      .collection("billing_orders")
      .where("confirmedAt", ">=", todayIso)
      .get();

    const orders: TodayOrder[] = snap.docs
      .filter((doc) => doc.data().status === "confirmed")
      .map((doc) => {
        const d = doc.data();
        return {
          orderId: doc.id,
          email: typeof d.email === "string" ? d.email : "",
          amount: typeof d.amount === "number" ? d.amount : 0,
          orderType: typeof d.orderType === "string" ? d.orderType : "",
          planTier: typeof d.planTier === "string" ? d.planTier : null,
          confirmedAt: typeof d.confirmedAt === "string" ? d.confirmedAt : "",
        };
      })
      .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));

    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/analytics/today-orders] ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
