export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/users";
import { getDb } from "@/lib/firebase-admin";

const VALID_STATUSES = new Set(["none", "pending", "issued"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  let body: { cashReceiptStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cashReceiptStatus } = body;
  if (!cashReceiptStatus || !VALID_STATUSES.has(cashReceiptStatus)) {
    return NextResponse.json(
      { error: "cashReceiptStatus must be one of: none, pending, issued" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();
    const update = {
      cashReceiptStatus,
      cashReceiptStatusUpdatedAt: now,
      cashReceiptStatusUpdatedBy: session?.user?.email ?? "admin",
    };

    const pendingRef = db.collection("pending_orders").doc(orderId);
    const billingRef = db.collection("billing_orders").doc(orderId);

    await db.runTransaction(async (tx) => {
      const pendingSnap = await tx.get(pendingRef);
      const billingSnap = await tx.get(billingRef);
      if (pendingSnap.exists) tx.update(pendingRef, update);
      if (billingSnap.exists) tx.update(billingRef, update);
    });

    return NextResponse.json({ success: true, orderId, cashReceiptStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/orders/cash-receipt-status] ${message}`);
    return NextResponse.json(
      { error: { code: "CASH_RECEIPT_STATUS_ERROR", message } },
      { status: 500 }
    );
  }
}
