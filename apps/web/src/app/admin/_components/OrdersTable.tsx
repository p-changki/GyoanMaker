"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MODEL_DISPLAY_NAMES } from "@gyoanmaker/shared/plans";
import type { TopUpCreditType } from "@gyoanmaker/shared/plans";

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

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
};

const PAGE_SIZE = 15;

function getOrderLabel(order: OrderRow): string {
  if (order.type === "subscription") {
    return PLAN_LABELS[order.planId ?? ""] ?? order.planId ?? "구독";
  }
  // topup: extract model from packageId (e.g. "flash_50" → "Speed 50")
  const pkgId = order.packageId ?? "";
  const match = pkgId.match(/^(flash|pro|illu)_(\d+)$/);
  if (match) {
    const model: TopUpCreditType =
      match[1] === "illu" ? "illustration" : (match[1] as "flash" | "pro");
    return `${MODEL_DISPLAY_NAMES[model]} ${match[2]}`;
  }
  return pkgId || "충전";
}

export default function OrdersTable() {
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "all", limit: "200" });
      const res = await fetch(`/api/admin/billing/orders?${params}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data = await res.json();
      setAllOrders(data.orders ?? []);
    } catch {
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const filteredOrders = useMemo(
    () =>
      activeFilter === "all"
        ? allOrders
        : allOrders.filter((o) => o.status === activeFilter),
    [allOrders, activeFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredOrders, currentPage]
  );

  const tabCounts: Record<StatusFilter, number> = {
    all: allOrders.length,
    confirmed: allOrders.filter((o) => o.status === "confirmed").length,
    paid_not_applied: allOrders.filter((o) => o.status === "paid_not_applied").length,
    failed: allOrders.filter((o) => o.status === "failed").length,
    pending: allOrders.filter((o) => o.status === "pending").length,
  };

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
      await fetchAllOrders();
    } catch {
      alert("Retry request failed");
    } finally {
      setRetrying(null);
    }
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    setExpandedId(null);
    setCurrentPage(1);
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
            {!loading && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/60">
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found</div>
      ) : (
        <>
          <div className="space-y-2">
            {pagedOrders.map((order) => (
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
                      {getOrderLabel(order)}
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
                        {order.type === "subscription" ? "구독" : "크레딧 충전"}
                      </div>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[28px] px-1.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    page === currentPage
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
