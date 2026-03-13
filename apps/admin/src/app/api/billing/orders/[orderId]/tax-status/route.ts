export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";

const VALID_TAX_STATUSES = new Set(["none", "pending", "issued"]);

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

  let body: { taxStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taxStatus } = body;
  if (!taxStatus || !VALID_TAX_STATUSES.has(taxStatus)) {
    return NextResponse.json(
      { error: "taxStatus must be one of: none, pending, issued" },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    const orderRef = db.collection("pending_orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await orderRef.update({
      taxStatus,
      taxStatusUpdatedAt: new Date().toISOString(),
      taxStatusUpdatedBy: session?.user?.email ?? "admin",
    });

    return NextResponse.json({ success: true, orderId, taxStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/orders/tax-status] ${message}`);
    return NextResponse.json(
      { error: { code: "TAX_STATUS_ERROR", message } },
      { status: 500 }
    );
  }
}
