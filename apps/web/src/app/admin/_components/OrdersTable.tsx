"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MODEL_DISPLAY_NAMES } from "@gyoanmaker/shared/plans";
import type { TopUpCreditType } from "@gyoanmaker/shared/plans";

interface OrderRow {
  orderId: string;
  email: string;
  type: "plan" | "topup";
  planId: string | null;
  packageId: string | null;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  failedAt: string | null;
  paidNotAppliedAt: string | null;
  errorMessage: string | null;
  checkoutFlow: string | null;
  depositorName: string | null;
  receiptType: string | null;
  receiptPhone: string | null;
  taxInvoiceInfo: {
    businessNumber: string;
    companyName: string;
    representative: string;
    email: string;
    businessType?: string;
    businessItem?: string;
    address?: string;
  } | null;
}

type StatusFilter = "all" | "confirmed" | "paid_not_applied" | "failed" | "pending" | "awaiting_deposit";
type FlowFilter = "all" | "card" | "bank_transfer";

const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: "all", label: "All", color: "bg-gray-100 text-gray-700" },
  { key: "awaiting_deposit", label: "입금 대기", color: "bg-purple-100 text-purple-700" },
  { key: "confirmed", label: "Confirmed", color: "bg-green-100 text-green-700" },
  { key: "paid_not_applied", label: "Paid Not Applied", color: "bg-red-100 text-red-700" },
  { key: "failed", label: "Failed", color: "bg-orange-100 text-orange-700" },
  { key: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  awaiting_deposit: "bg-purple-50 text-purple-600 border-purple-200",
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
  if (order.type === "plan") {
    return PLAN_LABELS[order.planId ?? ""] ?? order.planId ?? "이용권";
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
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
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

  const flowFilteredOrders = useMemo(
    () =>
      flowFilter === "all"
        ? allOrders
        : flowFilter === "bank_transfer"
          ? allOrders.filter((o) => o.checkoutFlow === "bank_transfer")
          : allOrders.filter((o) => o.checkoutFlow !== "bank_transfer"),
    [allOrders, flowFilter]
  );

  const filteredOrders = useMemo(
    () =>
      activeFilter === "all"
        ? flowFilteredOrders
        : flowFilteredOrders.filter((o) => o.status === activeFilter),
    [flowFilteredOrders, activeFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredOrders, currentPage]
  );

  const tabCounts: Record<StatusFilter, number> = {
    all: flowFilteredOrders.length,
    awaiting_deposit: flowFilteredOrders.filter((o) => o.status === "awaiting_deposit").length,
    confirmed: flowFilteredOrders.filter((o) => o.status === "confirmed").length,
    paid_not_applied: flowFilteredOrders.filter((o) => o.status === "paid_not_applied").length,
    failed: flowFilteredOrders.filter((o) => o.status === "failed").length,
    pending: flowFilteredOrders.filter((o) => o.status === "pending").length,
  };

  const flowCounts = {
    all: allOrders.length,
    card: allOrders.filter((o) => o.checkoutFlow !== "bank_transfer").length,
    bank_transfer: allOrders.filter((o) => o.checkoutFlow === "bank_transfer").length,
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

  const [bankActionId, setBankActionId] = useState<string | null>(null);

  const handleBankApprove = async (orderId: string) => {
    if (!confirm("입금 확인 후 서비스를 적용하시겠습니까?")) return;
    setBankActionId(orderId);
    try {
      const res = await fetch("/api/admin/billing/bank-transfer/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "승인 실패");
        return;
      }
      await fetchAllOrders();
    } catch {
      alert("승인 요청 실패");
    } finally {
      setBankActionId(null);
    }
  };

  const handleBankReject = async (orderId: string) => {
    const reason = prompt("거절 사유를 입력하세요 (선택):");
    if (reason === null) return;
    setBankActionId(orderId);
    try {
      const res = await fetch("/api/admin/billing/bank-transfer/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: reason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "거절 실패");
        return;
      }
      await fetchAllOrders();
    } catch {
      alert("거절 요청 실패");
    } finally {
      setBankActionId(null);
    }
  };

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    setExpandedId(null);
    setCurrentPage(1);
  };

  const handleFlowFilterChange = (flow: FlowFilter) => {
    setFlowFilter(flow);
    setActiveFilter("all");
    setExpandedId(null);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Billing Orders</h2>
          {!loading && tabCounts.awaiting_deposit > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              입금 대기 {tabCounts.awaiting_deposit}건
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Recent payment orders</p>
      </div>

      {/* Checkout flow filter */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {([
          { key: "all" as const, label: "전체" },
          { key: "card" as const, label: "카드결제" },
          { key: "bank_transfer" as const, label: "무통장입금" },
        ]).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFlowFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              flowFilter === f.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
            {!loading && (
              <span className="ml-1 text-[10px] opacity-60">{flowCounts[f.key]}</span>
            )}
          </button>
        ))}
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
                      {order.status === "awaiting_deposit" ? "입금 대기" : order.status.replace(/_/g, " ")}
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
                        {order.type === "plan" ? "이용권" : "크레딧 충전"}
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

                    {order.checkoutFlow === "bank_transfer" && order.depositorName && (
                      <div className="mt-2 space-y-1">
                        <div>
                          <span className="font-medium text-gray-600 text-xs">입금자명:</span>{" "}
                          <span className="text-xs text-gray-700 font-semibold">{order.depositorName}</span>
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full">
                            무통장입금
                          </span>
                        </div>
                        {order.receiptType === "cash_receipt" && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">현금영수증:</span>{" "}
                            {order.receiptPhone ?? "-"}
                          </div>
                        )}
                        {order.receiptType === "tax_invoice" && order.taxInvoiceInfo && (
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <span className="font-medium">세금계산서:</span>
                            <div className="ml-2">
                              {order.taxInvoiceInfo.businessNumber} · {order.taxInvoiceInfo.companyName} · {order.taxInvoiceInfo.representative} · {order.taxInvoiceInfo.email}
                              {order.taxInvoiceInfo.businessType && ` · ${order.taxInvoiceInfo.businessType}`}
                              {order.taxInvoiceInfo.businessItem && ` · ${order.taxInvoiceInfo.businessItem}`}
                              {order.taxInvoiceInfo.address && (
                                <div className="mt-0.5 text-gray-500">{order.taxInvoiceInfo.address}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {order.status === "awaiting_deposit" && order.checkoutFlow === "bank_transfer" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleBankApprove(order.orderId)}
                          disabled={bankActionId === order.orderId}
                          className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {bankActionId === order.orderId ? "처리 중..." : "입금 확인 (승인)"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBankReject(order.orderId)}
                          disabled={bankActionId === order.orderId}
                          className="px-4 py-1.5 bg-white border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          거절
                        </button>
                      </div>
                    )}

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
