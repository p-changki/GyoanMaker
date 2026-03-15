export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";
import { FieldPath } from "firebase-admin/firestore";

const VALID_STATUSES = new Set([
  "pending",
  "awaiting_deposit",
  "confirmed",
  "failed",
  "paid_not_applied",
]);

const VALID_FLOWS = new Set(["card", "bank_transfer"]);

function mapDoc(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const d = doc.data();
  return {
    orderId: doc.id,
    email: (d.email ?? "") as string,
    type: d.type === "topup" ? "topup" : "plan",
    planId: (d.planId ?? null) as string | null,
    packageId: (d.packageId ?? null) as string | null,
    amount: typeof d.amount === "number" ? d.amount : 0,
    status: (d.status ?? "pending") as string,
    createdAt: (d.createdAt ?? "") as string,
    confirmedAt: (d.confirmedAt ?? null) as string | null,
    failedAt: (d.failedAt ?? null) as string | null,
    paidNotAppliedAt: (d.paidNotAppliedAt ?? null) as string | null,
    errorMessage: (d.errorMessage ?? null) as string | null,
    checkoutFlow: (d.checkoutFlow ?? null) as string | null,
    depositorName: (d.depositorName ?? null) as string | null,
    receiptType: (d.receiptType ?? null) as string | null,
    receiptPhone: (d.receiptPhone ?? null) as string | null,
    taxInvoiceInfo: (d.taxInvoiceInfo ?? null) as unknown,
    taxStatus: (d.taxStatus ?? "none") as "none" | "pending" | "issued",
    taxStatusUpdatedAt: (d.taxStatusUpdatedAt ?? null) as string | null,
    cashReceiptStatus: (d.cashReceiptStatus ?? "none") as "none" | "pending" | "issued",
    cashReceiptStatusUpdatedAt: (d.cashReceiptStatusUpdatedAt ?? null) as string | null,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") ?? "all";
  const limitParam = parseInt(searchParams.get("limit") ?? "30", 10);
  const limit = Math.min(Math.max(1, limitParam), 100);
  const cursorParam = searchParams.get("cursor");
  const checkoutFlowParam = searchParams.get("checkoutFlow");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Whitelist-validate checkoutFlow
  const checkoutFlow =
    checkoutFlowParam && VALID_FLOWS.has(checkoutFlowParam)
      ? checkoutFlowParam
      : null;

  // Decode cursor: base64url(JSON.stringify({ createdAt, orderId }))
  let cursorCreatedAt: string | null = null;
  let cursorOrderId: string | null = null;
  if (cursorParam) {
    try {
      const decoded = JSON.parse(Buffer.from(cursorParam, "base64url").toString()) as {
        createdAt?: unknown;
        orderId?: unknown;
      };
      cursorCreatedAt = typeof decoded.createdAt === "string" ? decoded.createdAt : null;
      cursorOrderId = typeof decoded.orderId === "string" ? decoded.orderId : null;
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_CURSOR", message: "Invalid cursor format." } },
        { status: 400 }
      );
    }
  }

  try {
    const db = getDb();

    // Use createdAt + documentId as stable composite sort for cursor pagination
    let query: FirebaseFirestore.Query = db
      .collection("pending_orders")
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId());

    // Status filter
    if (statusFilter !== "all" && VALID_STATUSES.has(statusFilter)) {
      query = query.where("status", "==", statusFilter);
    }

    // checkoutFlow filter:
    // "bank_transfer" orders have checkoutFlow == "bank_transfer"
    // "card" orders have checkoutFlow == null (not stored, treated as card)
    if (checkoutFlow === "bank_transfer") {
      query = query.where("checkoutFlow", "==", "bank_transfer");
    } else if (checkoutFlow === "card") {
      query = query.where("checkoutFlow", "==", null);
    }

    // Date range filters on createdAt string field
    if (dateFrom) {
      query = query.where("createdAt", ">=", dateFrom);
    }
    if (dateTo) {
      query = query.where("createdAt", "<=", dateTo);
    }

    // Apply cursor for pagination
    if (cursorCreatedAt !== null && cursorOrderId !== null) {
      query = query.startAfter(cursorCreatedAt, cursorOrderId);
    }

    query = query.limit(limit);

    const snap = await query.get();
    const orders = snap.docs.map(mapDoc);

    const hasMore = orders.length === limit;
    const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null;
    const nextCursor =
      hasMore && lastOrder
        ? Buffer.from(
            JSON.stringify({ createdAt: lastOrder.createdAt, orderId: lastOrder.orderId })
          ).toString("base64url")
        : null;

    return NextResponse.json({ orders, nextCursor, hasMore });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/orders] ${message}`);
    return NextResponse.json(
      {
        error: {
          code: "BILLING_ORDERS_ERROR",
          message: "Failed to fetch billing orders.",
        },
      },
      { status: 500 }
    );
  }
}
