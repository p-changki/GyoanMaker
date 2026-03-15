"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MODEL_DISPLAY_NAMES } from "@gyoanmaker/shared/plans";
import type { TopUpCreditType } from "@gyoanmaker/shared/plans";
import type {
  FlowFilter,
  OrderRow,
  OrdersApiResponse,
  OrdersCountsResponse,
  ReceiptFilter,
  StatusFilter,
  TaxFilter,
} from "./ordersTable.types";
import { PLAN_LABELS } from "./ordersTable.types";

const PAGE_LIMIT = 30;

const INITIAL_TAB_COUNTS: Record<StatusFilter, number> = {
  all: 0,
  confirmed: 0,
  paid_not_applied: 0,
  failed: 0,
  pending: 0,
  awaiting_deposit: 0,
};

const INITIAL_FLOW_COUNTS: Record<FlowFilter, number> = {
  all: 0,
  card: 0,
  bank_transfer: 0,
};

interface FetchOrdersParams {
  status: StatusFilter;
  checkoutFlow: FlowFilter;
  dateFrom: string;
  dateTo: string;
  cursor: string | null;
}

interface FetchCountsParams {
  checkoutFlow: FlowFilter;
  dateFrom: string;
  dateTo: string;
}

export function getOrderLabel(order: OrderRow): string {
  if (order.type === "plan") {
    return PLAN_LABELS[order.planId ?? ""] ?? order.planId ?? "이용권";
  }
  const pkgId = order.packageId ?? "";
  const match = pkgId.match(/^(flash|pro|illu)_(\d+)$/);
  if (match) {
    const model: TopUpCreditType =
      match[1] === "illu" ? "illustration" : (match[1] as "flash" | "pro");
    return `${MODEL_DISPLAY_NAMES[model]} ${match[2]}`;
  }
  return pkgId || "충전";
}

export function exportTaxInvoiceCsv(orders: OrderRow[]) {
  const targets = orders.filter(
    (o) => o.receiptType === "tax_invoice" && o.status === "confirmed" && o.taxInvoiceInfo
  );
  if (targets.length === 0) {
    alert("세금계산서 신청 건이 없습니다.");
    return;
  }
  const header =
    "거래일,상호명,사업자번호,대표자명,세금계산서이메일,주소,업태,종목,금액(원),주문ID,구매자이메일,발행상태";
  const rows = targets.map((o) => {
    const info = o.taxInvoiceInfo!;
    const date = o.confirmedAt ? new Date(o.confirmedAt).toLocaleDateString("ko-KR") : "";
    const taxStatusLabel = o.taxStatus === "issued" ? "발행완료" : "미발행";
    return [
      date,
      info.companyName,
      info.businessNumber,
      info.representative,
      info.email,
      info.address ?? "",
      info.businessType ?? "",
      info.businessItem ?? "",
      o.amount,
      o.orderId,
      o.email,
      taxStatusLabel,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tax_invoice_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function useOrdersTable() {
  // ── Server-paged data ─────────────────────────────────────────────────────
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  // cursorStack[last] = cursor used to fetch current page (null = first page)
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);

  // ── Server filter state ───────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ── Client filter state ───────────────────────────────────────────────────
  const [taxFilter, setTaxFilter] = useState<TaxFilter>("all");
  const [receiptFilter, setReceiptFilter] = useState<ReceiptFilter>("all");
  const [amountMin, setAmountMin] = useState<string>("");
  const [amountMax, setAmountMax] = useState<string>("");

  // ── Counts (from API, not derived from page data) ─────────────────────────
  const [tabCounts, setTabCounts] = useState<Record<StatusFilter, number>>(INITIAL_TAB_COUNTS);
  const [flowCounts, setFlowCounts] = useState<Record<FlowFilter, number>>(INITIAL_FLOW_COUNTS);

  // ── Other UI state ────────────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [taxUpdating, setTaxUpdating] = useState<string | null>(null);
  const [cashReceiptUpdating, setCashReceiptUpdating] = useState<string | null>(null);
  const [bankActionId, setBankActionId] = useState<string | null>(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (params: FetchOrdersParams) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams({ limit: String(PAGE_LIMIT) });
      if (params.status !== "all") urlParams.set("status", params.status);
      if (params.checkoutFlow !== "all") urlParams.set("checkoutFlow", params.checkoutFlow);
      if (params.dateFrom) urlParams.set("dateFrom", params.dateFrom);
      if (params.dateTo) urlParams.set("dateTo", params.dateTo);
      if (params.cursor) urlParams.set("cursor", params.cursor);
      const res = await fetch(`/api/billing/orders?${urlParams}`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data: OrdersApiResponse = await res.json();
      setOrders(data.orders ?? []);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      setOrders([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCounts = useCallback(async (params: FetchCountsParams) => {
    try {
      const urlParams = new URLSearchParams();
      if (params.checkoutFlow !== "all") urlParams.set("checkoutFlow", params.checkoutFlow);
      if (params.dateFrom) urlParams.set("dateFrom", params.dateFrom);
      if (params.dateTo) urlParams.set("dateTo", params.dateTo);
      const res = await fetch(`/api/billing/orders/counts?${urlParams}`);
      if (!res.ok) return;
      const data: OrdersCountsResponse = await res.json();
      setTabCounts(data.counts);
      setFlowCounts(data.flowCounts);
    } catch {
      // keep current counts on error
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchOrders({ status: "all", checkoutFlow: "all", dateFrom: "", dateTo: "", cursor: null });
    fetchCounts({ checkoutFlow: "all", dateFrom: "", dateTo: "" });
  }, [fetchOrders, fetchCounts]);

  // ── Client-side filtering (on current page data) ──────────────────────────

  const taxFilteredOrders = useMemo(() => {
    if (taxFilter === "all") return orders;
    if (taxFilter === "tax_invoice_pending") {
      return orders.filter(
        (o) => o.receiptType === "tax_invoice" && o.status === "confirmed" && o.taxStatus !== "issued"
      );
    }
    return orders.filter(
      (o) => o.receiptType === "tax_invoice" && o.taxStatus === "issued"
    );
  }, [orders, taxFilter]);

  const receiptFilteredOrders = useMemo(() => {
    if (receiptFilter === "all") return taxFilteredOrders;
    if (receiptFilter === "cash_receipt_pending") {
      return taxFilteredOrders.filter(
        (o) => o.receiptType === "cash_receipt" && o.status === "confirmed" && o.cashReceiptStatus !== "issued"
      );
    }
    return taxFilteredOrders.filter(
      (o) => o.receiptType === "cash_receipt" && o.cashReceiptStatus === "issued"
    );
  }, [taxFilteredOrders, receiptFilter]);

  const displayOrders = useMemo(() => {
    let result = receiptFilteredOrders;
    const min = amountMin !== "" ? Number(amountMin) : null;
    const max = amountMax !== "" ? Number(amountMax) : null;
    if (min !== null) result = result.filter((o) => o.amount >= min);
    if (max !== null) result = result.filter((o) => o.amount <= max);
    return result;
  }, [receiptFilteredOrders, amountMin, amountMax]);

  // Pending counts derived from current page (approximate)
  const taxInvoicePendingCount = useMemo(
    () =>
      orders.filter(
        (o) => o.receiptType === "tax_invoice" && o.status === "confirmed" && o.taxStatus !== "issued"
      ).length,
    [orders]
  );

  const cashReceiptPendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.receiptType === "cash_receipt" &&
          o.status === "confirmed" &&
          o.cashReceiptStatus !== "issued"
      ).length,
    [orders]
  );

  // ── Pagination handlers ───────────────────────────────────────────────────

  const handleNextPage = () => {
    if (!hasMore || !nextCursor) return;
    const newStack = [...cursorStack, nextCursor];
    setCursorStack(newStack);
    setExpandedId(null);
    fetchOrders({ status: activeFilter, checkoutFlow: flowFilter, dateFrom, dateTo, cursor: nextCursor });
  };

  const handlePrevPage = () => {
    if (cursorStack.length <= 1) return;
    const newStack = cursorStack.slice(0, -1);
    const prevCursor = newStack[newStack.length - 1] ?? null;
    setCursorStack(newStack);
    setExpandedId(null);
    fetchOrders({ status: activeFilter, checkoutFlow: flowFilter, dateFrom, dateTo, cursor: prevCursor });
  };

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleRetry = async (orderId: string) => {
    setRetrying(orderId);
    const cursor = cursorStack[cursorStack.length - 1] ?? null;
    try {
      const res = await fetch("/api/billing/retry-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "Retry failed");
        return;
      }
      await fetchOrders({ status: activeFilter, checkoutFlow: flowFilter, dateFrom, dateTo, cursor });
    } catch {
      alert("Retry request failed");
    } finally {
      setRetrying(null);
    }
  };

  const handleBankApprove = async (orderId: string) => {
    if (!confirm("입금 확인 후 서비스를 적용하시겠습니까?")) return;
    setBankActionId(orderId);
    const cursor = cursorStack[cursorStack.length - 1] ?? null;
    try {
      const res = await fetch("/api/billing/bank-transfer/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "승인 실패");
        return;
      }
      await fetchOrders({ status: activeFilter, checkoutFlow: flowFilter, dateFrom, dateTo, cursor });
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
    const cursor = cursorStack[cursorStack.length - 1] ?? null;
    try {
      const res = await fetch("/api/billing/bank-transfer/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: reason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "거절 실패");
        return;
      }
      await fetchOrders({ status: activeFilter, checkoutFlow: flowFilter, dateFrom, dateTo, cursor });
    } catch {
      alert("거절 요청 실패");
    } finally {
      setBankActionId(null);
    }
  };

  const handleTaxStatusUpdate = async (orderId: string, taxStatus: "issued" | "none") => {
    setTaxUpdating(orderId);
    try {
      const res = await fetch(`/api/billing/orders/${orderId}/tax-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "발행 상태 업데이트 실패");
        return;
      }
      // Optimistic local update for current page
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? { ...o, taxStatus, taxStatusUpdatedAt: new Date().toISOString() }
            : o
        )
      );
    } catch {
      alert("발행 상태 업데이트 요청 실패");
    } finally {
      setTaxUpdating(null);
    }
  };

  const handleCashReceiptStatusUpdate = async (orderId: string, cashReceiptStatus: "issued" | "none") => {
    setCashReceiptUpdating(orderId);
    try {
      const res = await fetch(`/api/billing/orders/${orderId}/cash-receipt-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cashReceiptStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "현금영수증 상태 업데이트 실패");
        return;
      }
      // Optimistic local update for current page
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === orderId
            ? { ...o, cashReceiptStatus, cashReceiptStatusUpdatedAt: new Date().toISOString() }
            : o
        )
      );
    } catch {
      alert("현금영수증 상태 업데이트 요청 실패");
    } finally {
      setCashReceiptUpdating(null);
    }
  };

  // ── Server filter change handlers (reset cursor, refetch) ─────────────────

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    setCursorStack([null]);
    setExpandedId(null);
    // status filter doesn't affect counts API
    fetchOrders({ status: filter, checkoutFlow: flowFilter, dateFrom, dateTo, cursor: null });
  };

  const handleFlowFilterChange = (flow: FlowFilter) => {
    setFlowFilter(flow);
    setActiveFilter("all");
    setTaxFilter("all");
    setCursorStack([null]);
    setExpandedId(null);
    fetchOrders({ status: "all", checkoutFlow: flow, dateFrom, dateTo, cursor: null });
    fetchCounts({ checkoutFlow: flow, dateFrom, dateTo });
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setCursorStack([null]);
    fetchOrders({ status: activeFilter, checkoutFlow: flowFilter, dateFrom: from, dateTo: to, cursor: null });
    fetchCounts({ checkoutFlow: flowFilter, dateFrom: from, dateTo: to });
  };

  // ── Client filter change handlers (no server refetch) ─────────────────────

  const handleAmountRangeChange = (min: string, max: string) => {
    setAmountMin(min);
    setAmountMax(max);
  };

  const handleTaxFilterChange = (tax: TaxFilter) => {
    setTaxFilter(tax);
    setReceiptFilter("all");
    setExpandedId(null);
  };

  const handleReceiptFilterChange = (receipt: ReceiptFilter) => {
    setReceiptFilter(receipt);
    setTaxFilter("all");
    setExpandedId(null);
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  return {
    // state
    orders,
    loading,
    hasMore,
    cursorStack,
    activeFilter,
    flowFilter,
    taxFilter,
    receiptFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    expandedId,
    retrying,
    taxUpdating,
    cashReceiptUpdating,
    bankActionId,
    // derived
    displayOrders,
    tabCounts,
    taxInvoicePendingCount,
    cashReceiptPendingCount,
    flowCounts,
    // handlers
    toggleExpanded,
    handleFilterChange,
    handleFlowFilterChange,
    handleTaxFilterChange,
    handleReceiptFilterChange,
    handleDateRangeChange,
    handleAmountRangeChange,
    handleNextPage,
    handlePrevPage,
    handleRetry,
    handleBankApprove,
    handleBankReject,
    handleTaxStatusUpdate,
    handleCashReceiptStatusUpdate,
  };
}
