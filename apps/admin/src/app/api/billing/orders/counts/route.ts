export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getDb } from "@gyoanmaker/server-lib/firebase-admin";
import { AggregateField } from "firebase-admin/firestore";

const VALID_FLOWS = new Set(["card", "bank_transfer"]);

type OrderStatus =
  | "confirmed"
  | "awaiting_deposit"
  | "paid_not_applied"
  | "failed"
  | "pending";

interface CountsResponse {
  counts: {
    all: number;
    confirmed: number;
    awaiting_deposit: number;
    paid_not_applied: number;
    failed: number;
    pending: number;
  };
  flowCounts: {
    all: number;
    card: number;
    bank_transfer: number;
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const checkoutFlowParam = searchParams.get("checkoutFlow");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Whitelist-validate checkoutFlow
  const checkoutFlow =
    checkoutFlowParam && VALID_FLOWS.has(checkoutFlowParam)
      ? checkoutFlowParam
      : null;

  try {
    const db = getDb();

    // Build base query with optional filters (no status or flow filter)
    function buildBase(): FirebaseFirestore.Query {
      let q: FirebaseFirestore.Query = db.collection("pending_orders");
      if (dateFrom) q = q.where("createdAt", ">=", dateFrom);
      if (dateTo) q = q.where("createdAt", "<=", dateTo);
      if (checkoutFlow === "bank_transfer") {
        q = q.where("checkoutFlow", "==", "bank_transfer");
      } else if (checkoutFlow === "card") {
        q = q.where("checkoutFlow", "in", ["widget", "paylink"]);
      }
      return q;
    }

    // Build flow-specific base (no date/flow filter applied here, used only for flowCounts)
    function buildFlowBase(): FirebaseFirestore.Query {
      let q: FirebaseFirestore.Query = db.collection("pending_orders");
      if (dateFrom) q = q.where("createdAt", ">=", dateFrom);
      if (dateTo) q = q.where("createdAt", "<=", dateTo);
      return q;
    }

    const countField = AggregateField.count();
    const base = buildBase();
    const flowBase = buildFlowBase();

    // Run 8 parallel aggregate count queries:
    //   - all + 5 status-specific (under base filters)
    //   - flowCounts: all + bank_transfer (card = all - bank_transfer)
    const [
      allCount,
      confirmedCount,
      awaitingCount,
      paidNotAppliedCount,
      failedCount,
      pendingCount,
      flowAllCount,
      flowBankTransferCount,
    ] = await Promise.all([
      base.aggregate({ n: countField }).get(),
      base.where("status", "==", "confirmed" satisfies OrderStatus).aggregate({ n: countField }).get(),
      base.where("status", "==", "awaiting_deposit" satisfies OrderStatus).aggregate({ n: countField }).get(),
      base.where("status", "==", "paid_not_applied" satisfies OrderStatus).aggregate({ n: countField }).get(),
      base.where("status", "==", "failed" satisfies OrderStatus).aggregate({ n: countField }).get(),
      base.where("status", "==", "pending" satisfies OrderStatus).aggregate({ n: countField }).get(),
      flowBase.aggregate({ n: countField }).get(),
      flowBase.where("checkoutFlow", "==", "bank_transfer").aggregate({ n: countField }).get(),
    ]);

    const flowAll = flowAllCount.data().n ?? 0;
    const flowBankTransfer = flowBankTransferCount.data().n ?? 0;

    const result: CountsResponse = {
      counts: {
        all: allCount.data().n ?? 0,
        confirmed: confirmedCount.data().n ?? 0,
        awaiting_deposit: awaitingCount.data().n ?? 0,
        paid_not_applied: paidNotAppliedCount.data().n ?? 0,
        failed: failedCount.data().n ?? 0,
        pending: pendingCount.data().n ?? 0,
      },
      flowCounts: {
        all: flowAll,
        bank_transfer: flowBankTransfer,
        card: Math.max(0, flowAll - flowBankTransfer),
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[admin/billing/orders/counts] ${message}`);
    return NextResponse.json(
      {
        error: {
          code: "BILLING_COUNTS_ERROR",
          message: "Failed to fetch order counts.",
        },
      },
      { status: 500 }
    );
  }
}
