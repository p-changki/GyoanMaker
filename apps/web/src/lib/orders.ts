import { getDb } from "./firebase-admin";

export interface OrderRow {
  orderId: string;
  type: "subscription" | "topup";
  orderName: string;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
}

interface RawOrder {
  orderId?: string;
  email?: string;
  type?: string;
  orderName?: string;
  planId?: string;
  packageId?: string;
  amount?: number;
  status?: string;
  createdAt?: string | { toDate?: () => Date };
  confirmedAt?: string | { toDate?: () => Date } | null;
}

function toIsoString(value: string | { toDate?: () => Date } | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}

function toOrderRow(data: RawOrder): OrderRow {
  const orderName =
    data.orderName ??
    (data.type === "subscription"
      ? `${(data.planId ?? "plan").toUpperCase()} 구독`
      : `${(data.packageId ?? "topup").toUpperCase()} 충전`);

  return {
    orderId: data.orderId ?? "",
    type: data.type === "topup" ? "topup" : "subscription",
    orderName,
    amount: typeof data.amount === "number" ? data.amount : 0,
    status: typeof data.status === "string" ? data.status : "pending",
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
    confirmedAt: toIsoString(data.confirmedAt),
  };
}

export async function getUserOrders(
  email: string,
  limit: number
): Promise<OrderRow[]> {
  const key = email.toLowerCase();
  const db = getDb();

  const [billingSnap, pendingSnap] = await Promise.all([
    db
      .collection("billing_orders")
      .where("email", "==", key)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get(),
    db
      .collection("pending_orders")
      .where("email", "==", key)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get(),
  ]);

  const seenIds = new Set<string>();
  const rows: OrderRow[] = [];

  for (const doc of billingSnap.docs) {
    const data = doc.data() as RawOrder;
    const row = toOrderRow(data);
    seenIds.add(row.orderId);
    rows.push(row);
  }

  // Mark stale pending orders (older than 1 hour) as expired so users can see them.
  const STALE_MS = 60 * 60 * 1000;
  const now = Date.now();
  for (const doc of pendingSnap.docs) {
    const data = { ...doc.data(), orderId: doc.id } as RawOrder;
    if (seenIds.has(data.orderId ?? "")) continue;
    const row = toOrderRow(data);
    const age = now - new Date(row.createdAt).getTime();
    if (age > STALE_MS) {
      row.status = "expired";
    }
    rows.push(row);
  }

  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return rows.slice(0, limit);
}
