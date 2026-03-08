"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Pagination from "./Pagination";

interface OrderRow {
  orderId: string;
  type: "subscription" | "topup";
  orderName: string;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
}

const PAGE_SIZE = 10;

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-gray-50 text-gray-600 border-gray-200",
  expired: "bg-gray-50 text-gray-400 border-gray-200",
  paid_not_applied: "bg-orange-50 text-orange-700 border-orange-200",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "완료",
  failed: "실패",
  pending: "대기",
  expired: "만료",
  paid_not_applied: "미적용",
};

function formatDateKr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getMonthKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${year}년 ${Number(month)}월`;
}

async function fetchOrders(): Promise<OrderRow[]> {
  const res = await fetch("/api/billing/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  const data = await res.json();
  return data.orders ?? [];
}

export default function PaymentHistorySection({ embedded }: { embedded?: boolean } = {}) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["billing-orders"],
    queryFn: fetchOrders,
  });

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [page, setPage] = useState(1);

  const months = useMemo(() => {
    if (!orders) return [];
    const set = new Set<string>();
    for (const o of orders) {
      const key = getMonthKey(o.createdAt);
      if (key) set.add(key);
    }
    return Array.from(set).sort().reverse();
  }, [orders]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (selectedMonth === "all") return orders;
    return orders.filter((o) => getMonthKey(o.createdAt) === selectedMonth);
  }, [orders, selectedMonth]);

  const totalPages = useMemo(
    () => Math.ceil(filtered.length / PAGE_SIZE),
    [filtered],
  );

  const pageOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset to page 1 when month filter changes
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setPage(1);
  };

  return (
    <section className={embedded ? undefined : "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"}>
      <div className="flex items-center justify-between">
        {!embedded && (
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
            Payment History
          </h3>
        )}
        {orders && orders.length > 0 && (
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="ml-auto text-xs text-gray-500 border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#5E35B1]/30"
          >
            <option value="all">전체</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 h-16 animate-pulse rounded-lg bg-gray-100" />
      ) : !orders || orders.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">결제 이력이 없습니다</p>
      ) : filtered.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">해당 월의 결제 이력이 없습니다</p>
      ) : (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">날짜</th>
                  <th className="pb-2 font-medium">내용</th>
                  <th className="pb-2 text-right font-medium">금액</th>
                  <th className="pb-2 text-right font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td className="py-2.5 text-gray-500">
                      {formatDateKr(order.createdAt)}
                    </td>
                    <td className="py-2.5 font-medium text-gray-900">
                      {order.orderName}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">
                      {order.amount.toLocaleString()}원
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_STYLE[order.status] ??
                          "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
