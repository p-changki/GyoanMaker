"use client";

import { useCallback, useEffect, useState } from "react";

interface OrderRow {
  orderId: string;
  email: string;
  type: "subscription" | "topup";
  planId: string | null;
  packageId: string | null;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  failedAt: string | null;
  paidNotAppliedAt: string | null;
  paymentKey: string | null;
  errorMessage: string | null;
}

type StatusFilter = "all" | "confirmed" | "paid_not_applied" | "failed" | "pending";

const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: "all", label: "All", color: "bg-gray-100 text-gray-700" },
  { key: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700" },
  { key: "paid_not_applied", label: "Paid Not Applied", color: "bg-red-100 text-red-700" },
  { key: "failed", label: "Failed", color: "bg-orange-100 text-orange-700" },
  { key: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  confirmed: "bg-green-50 text-green-600 border-green-200",
  failed: "bg-orange-50 text-orange-600 border-orange-200",
  paid_not_applied: "bg-red-50 text-red-600 border-red-200",
};

export default function OrdersTable() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: StatusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, limit: "50" });
      const res = await fetch(`/api/admin/billing/orders?${params}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeFilter);
  }, [activeFilter, fetchOrders]);

  const handleRetry = async (orderId: string) => {
    setRetrying(orderId);
    try {
      const res = await fetch("/api/admin/billing/retry-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "Retry failed");
        return;
      }
      await fetchOrders(activeFilter);
    } catch {
      alert("Retry request failed");
    } finally {
      setRetrying(null);
    }
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    setExpandedId(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Billing Orders</h2>
        <p className="text-sm text-gray-500 mt-0.5">Recent payment orders</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === tab.key
                ? `${tab.color} shadow-sm`
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((prev) =>
                    prev === order.orderId ? null : order.orderId
                  )
                }
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <code className="text-xs text-gray-500 font-mono shrink-0">
                    {order.orderId.slice(0, 8)}
                  </code>
                  <span className="text-sm text-gray-700 truncate">
                    {order.email}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {order.type === "subscription"
                      ? order.planId ?? "plan"
                      : order.packageId ?? "topup"}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">
                    ₩{order.amount.toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${
                      STATUS_BADGE[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-gray-400 hidden sm:inline">
                    {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </button>

              {expandedId === order.orderId && (
                <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50/30">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
                    <div>
                      <span className="font-medium text-gray-600">Order ID:</span>{" "}
                      <code className="font-mono">{order.orderId}</code>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>{" "}
                      {order.type}
                    </div>
                    {order.paymentKey && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Payment Key:
                        </span>{" "}
                        <code className="font-mono">
                          {order.paymentKey.slice(0, 12)}...
                        </code>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-600">Created:</span>{" "}
                      {new Date(order.createdAt).toLocaleString("ko-KR")}
                    </div>
                    {order.confirmedAt && (
                      <div>
                        <span className="font-medium text-gray-600">
                          Confirmed:
                        </span>{" "}
                        {new Date(order.confirmedAt).toLocaleString("ko-KR")}
                      </div>
                    )}
                    {order.errorMessage && (
                      <div className="col-span-2">
                        <span className="font-medium text-red-600">Error:</span>{" "}
                        <span className="text-red-500">{order.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  {order.status === "paid_not_applied" && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleRetry(order.orderId)}
                        disabled={retrying === order.orderId}
                        className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {retrying === order.orderId
                          ? "Retrying..."
                          : "Retry Apply"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
