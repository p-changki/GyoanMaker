"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

interface OrderRow {
  orderId: string;
  orderName: string;
  amount: number;
  status: string;
  createdAt: string;
  checkoutFlow: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "완료",
  failed: "실패",
  pending: "대기",
  expired: "만료",
  awaiting_deposit: "입금 대기",
  paid_not_applied: "미적용",
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  awaiting_deposit: "bg-amber-50 text-amber-700 border-amber-200",
  paid_not_applied: "bg-orange-50 text-orange-700 border-orange-200",
};

async function fetchOrders(): Promise<OrderRow[]> {
  const res = await fetch("/api/billing/orders");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.orders ?? [];
}

export default function RecentOrders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["billing-orders"],
    queryFn: fetchOrders,
  });

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
        <div className="mt-3 space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </section>
    );
  }

  if (!orders || orders.length === 0) return null;

  const recent = orders.slice(0, 3);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          최근 결제
        </h3>
        <Link
          href="/billing"
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          전체 내역 보기
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {recent.map((order) => (
          <div
            key={order.orderId}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {order.orderName}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                {order.checkoutFlow === "bank_transfer" && " · 무통장입금"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {order.amount.toLocaleString()}원
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  STATUS_COLOR[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
