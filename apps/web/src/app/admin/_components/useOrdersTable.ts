"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MODEL_DISPLAY_NAMES } from "@gyoanmaker/shared/plans";
import type { TopUpCreditType } from "@gyoanmaker/shared/plans";
import type {
  FlowFilter,
  OrderRow,
  StatusFilter,
  TaxFilter,
} from "./ordersTable.types";
import { PLAN_LABELS } from "./ordersTable.types";

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
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [taxFilter, setTaxFilter] = useState<TaxFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [taxUpdating, setTaxUpdating] = useState<string | null>(null);
  const [bankActionId, setBankActionId] = useState<string | null>(null);
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

  // ── Filtering ─────────────────────────────────────────────────────────────

  const flowFilteredOrders = useMemo(() => {
    if (flowFilter === "all") return allOrders;
    if (flowFilter === "bank_transfer") return allOrders.filter((o) => o.checkoutFlow === "bank_transfer");
    return allOrders.filter((o) => o.checkoutFlow !== "bank_transfer");
  }, [allOrders, flowFilter]);

  const taxFilteredOrders = useMemo(() => {
    if (taxFilter === "all") return flowFilteredOrders;
    if (taxFilter === "tax_invoice_pending") {
      return flowFilteredOrders.filter(
        (o) => o.receiptType === "tax_invoice" && o.status === "confirmed" && o.taxStatus !== "issued"
      );
    }
    return flowFilteredOrders.filter(
      (o) => o.receiptType === "tax_invoice" && o.taxStatus === "issued"
    );
  }, [flowFilteredOrders, taxFilter]);

  const filteredOrders = useMemo(
    () => (activeFilter === "all" ? taxFilteredOrders : taxFilteredOrders.filter((o) => o.status === activeFilter)),
    [taxFilteredOrders, activeFilter]
  );

  // ── Counts ─────────────────────────────────────────────────────────────────

  const tabCounts: Record<StatusFilter, number> = {
    all: taxFilteredOrders.length,
    awaiting_deposit: taxFilteredOrders.filter((o) => o.status === "awaiting_deposit").length,
    confirmed: taxFilteredOrders.filter((o) => o.status === "confirmed").length,
    paid_not_applied: taxFilteredOrders.filter((o) => o.status === "paid_not_applied").length,
    failed: taxFilteredOrders.filter((o) => o.status === "failed").length,
    pending: taxFilteredOrders.filter((o) => o.status === "pending").length,
  };

  const taxInvoicePendingCount = flowFilteredOrders.filter(
    (o) => o.receiptType === "tax_invoice" && o.status === "confirmed" && o.taxStatus !== "issued"
  ).length;

  const flowCounts = {
    all: allOrders.length,
    card: allOrders.filter((o) => o.checkoutFlow !== "bank_transfer").length,
    bank_transfer: allOrders.filter((o) => o.checkoutFlow === "bank_transfer").length,
  };

  // ── Pagination ─────────────────────────────────────────────────────────────

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = useMemo(
    () => filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredOrders, currentPage]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

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

  const handleTaxStatusUpdate = async (orderId: string, taxStatus: "issued" | "none") => {
    setTaxUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/billing/orders/${orderId}/tax-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "발행 상태 업데이트 실패");
        return;
      }
      setAllOrders((prev) =>
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

  const handleFilterChange = (filter: StatusFilter) => {
    setActiveFilter(filter);
    setExpandedId(null);
    setCurrentPage(1);
  };

  const handleFlowFilterChange = (flow: FlowFilter) => {
    setFlowFilter(flow);
    setActiveFilter("all");
    setTaxFilter("all");
    setExpandedId(null);
    setCurrentPage(1);
  };

  const handleTaxFilterChange = (tax: TaxFilter) => {
    setTaxFilter(tax);
    setActiveFilter("all");
    setExpandedId(null);
    setCurrentPage(1);
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  return {
    // state
    allOrders,
    loading,
    activeFilter,
    flowFilter,
    taxFilter,
    expandedId,
    retrying,
    taxUpdating,
    bankActionId,
    currentPage,
    // derived
    pagedOrders,
    filteredOrders,
    tabCounts,
    taxInvoicePendingCount,
    flowCounts,
    totalPages,
    // handlers
    setCurrentPage,
    toggleExpanded,
    handleFilterChange,
    handleFlowFilterChange,
    handleTaxFilterChange,
    handleRetry,
    handleBankApprove,
    handleBankReject,
    handleTaxStatusUpdate,
  };
}
