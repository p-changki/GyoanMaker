"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsData } from "@/app/api/analytics/route";
import KpiGrid from "./dashboard/KpiGrid";
import AnalyticsSubTabs from "./dashboard/AnalyticsSubTabs";
import RevenueAnalytics from "./dashboard/RevenueAnalytics";
import UsageAnalytics from "./dashboard/UsageAnalytics";
import UserAnalytics from "./dashboard/UserAnalytics";
import type { AnalyticsSubTab } from "./dashboard/analytics.constants";
import type { TodayOrder } from "@/app/api/analytics/today-orders/route";

interface AppUser {
  email: string;
  name: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
  createdAt: string;
}

interface BillingSummaryData {
  monthlyRevenue: number;
  monthlyOrderCount: number;
  pendingCount: number;
  paidNotAppliedCount: number;
  failedCount: number;
}

function TodayOrdersModal({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<TodayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/today-orders")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json() as Promise<{ orders: TodayOrder[] }>;
      })
      .then((d) => setOrders(d.orders))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "오류 발생"))
      .finally(() => setLoading(false));
  }, []);

  const total = orders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">오늘 결제 내역</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("ko-KR")} 기준 확정된 결제
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-8">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">오늘 결제 내역이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{order.email}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.orderType === "plan" ? "플랜" : "충전"}
                      {order.planTier ? ` · ${order.planTier}` : ""}
                      {" · "}
                      {new Date(order.confirmedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0 ml-4">
                    ₩{order.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {!loading && orders.length > 0 && (
          <div className="p-5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{orders.length}건</span>
            <span className="text-sm font-bold text-gray-900">합계 ₩{total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [billing, setBilling] = useState<BillingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>("revenue");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, billingRes] = await Promise.allSettled([
        fetch("/api/analytics").then((r) => (r.ok ? (r.json() as Promise<AnalyticsData>) : null)),
        fetch("/api/users").then((r) => (r.ok ? r.json() : { users: [] })),
        fetch("/api/billing/summary").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value) {
        setAnalytics(analyticsRes.value);
      }
      if (usersRes.status === "fulfilled" && usersRes.value) {
        setUsers((usersRes.value as { users: AppUser[] }).users ?? []);
      }
      if (billingRes.status === "fulfilled" && billingRes.value) {
        setBilling(billingRes.value as BillingSummaryData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const pendingCount = users.filter((u) => u.status === "pending").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-xl animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-xl animate-pulse h-52" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KpiGrid
        analytics={analytics}
        pendingUserCount={pendingCount}
        monthlyOrderCount={billing?.monthlyOrderCount ?? 0}
        paidNotAppliedCount={billing?.paidNotAppliedCount ?? 0}
        onOpenTodayModal={() => setShowTodayModal(true)}
      />

      <AnalyticsSubTabs activeTab={activeSubTab} onChange={setActiveSubTab} />

      {activeSubTab === "revenue" && (
        <RevenueAnalytics analytics={analytics} onOpenTodayModal={() => setShowTodayModal(true)} />
      )}
      {activeSubTab === "usage" && <UsageAnalytics analytics={analytics} />}
      {activeSubTab === "users" && <UserAnalytics analytics={analytics} users={users} />}

      {showTodayModal && <TodayOrdersModal onClose={() => setShowTodayModal(false)} />}
    </div>
  );
}
