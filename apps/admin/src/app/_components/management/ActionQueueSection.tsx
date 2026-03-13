"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmModal from "../shared/ConfirmModal";

interface PendingUser {
  email: string;
  name: string | null;
  createdAt: string;
}

interface PaidNotAppliedOrder {
  orderId: string;
  email: string;
  orderName: string;
  amount: number;
  createdAt: string;
}

export default function ActionQueueSection() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [paidNotAppliedOrders, setPaidNotAppliedOrders] = useState<PaidNotAppliedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [bulkRejectConfirm, setBulkRejectConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, ordersRes] = await Promise.allSettled([
        fetch("/api/users").then((r) => (r.ok ? r.json() : { users: [] })),
        fetch("/api/billing/orders?status=all&limit=200").then((r) => (r.ok ? r.json() : { orders: [] })),
      ]);

      if (usersRes.status === "fulfilled") {
        const allUsers = (usersRes.value as { users: (PendingUser & { status: string })[] }).users ?? [];
        setPendingUsers(allUsers.filter((u) => u.status === "pending"));
      }
      if (ordersRes.status === "fulfilled") {
        const allOrders = (ordersRes.value as { orders: (PaidNotAppliedOrder & { status: string })[] }).orders ?? [];
        setPaidNotAppliedOrders(allOrders.filter((o) => o.status === "paid_not_applied").slice(0, 20));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로딩 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (email: string, status: "approved" | "rejected") => {
    setUpdating(email);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      await fetchData();
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(email);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selected).map(async (email) => {
          const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" }),
          });
          if (!res.ok) throw new Error(`${email} 승인 실패`);
        })
      );
      setSelected(new Set());
      await fetchData();
    } catch {
      setError("일부 승인 처리에 실패했습니다.");
      await fetchData();
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selected.size === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selected).map(async (email) => {
          const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "rejected" }),
          });
          if (!res.ok) throw new Error(`${email} 거부 실패`);
        })
      );
      setSelected(new Set());
      await fetchData();
    } catch {
      setError("일부 거부 처리에 실패했습니다.");
      await fetchData();
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleRetry = async (orderId: string) => {
    setRetrying(orderId);
    try {
      const res = await fetch("/api/billing/retry-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: { message?: string } })?.error?.message ?? "재처리 실패");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "재처리 실패");
    } finally {
      setRetrying(null);
    }
  };

  const toggleSelect = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === pendingUsers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingUsers.map((u) => u.email)));
    }
  };

  const hasActions = pendingUsers.length > 0 || paidNotAppliedOrders.length > 0;

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-2xl p-5 animate-pulse h-32" />
    );
  }

  if (!hasActions) {
    return (
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-400">처리 대기 중인 항목이 없습니다 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </span>
              <p className="text-sm font-bold text-amber-800">
                미승인 유저 ({pendingUsers.length}건)
              </p>
            </div>
            {pendingUsers.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  {selected.size === pendingUsers.length ? "전체 해제" : "전체 선택"}
                </button>
                {selected.size > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleBulkApprove}
                      disabled={bulkProcessing}
                      className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {bulkProcessing ? "처리 중..." : `${selected.size}명 승인`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkRejectConfirm(true)}
                      disabled={bulkProcessing}
                      className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {bulkProcessing ? "처리 중..." : `${selected.size}명 거부`}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="divide-y divide-amber-100">
            {pendingUsers.map((user) => (
              <div key={user.email} className="flex items-center gap-3 px-4 py-3">
                {pendingUsers.length > 1 && (
                  <input
                    type="checkbox"
                    checked={selected.has(user.email)}
                    onChange={() => toggleSelect(user.email)}
                    className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                )}
                <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name ?? "이름 없음"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <p className="text-[10px] text-gray-400 shrink-0">
                  {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                </p>
                {updating === user.email ? (
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(user.email, "approved")}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectTarget(user.email)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                    >
                      거부
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid Not Applied Orders */}
      {paidNotAppliedOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </span>
              <p className="text-sm font-bold text-red-800">
                결제 미적용 ({paidNotAppliedOrders.length}건) — 재처리 필요
              </p>
            </div>
          </div>
          <div className="divide-y divide-red-100">
            {paidNotAppliedOrders.map((order) => (
              <div key={order.orderId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{order.email}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.orderName} · ₩{order.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{order.orderId.slice(0, 20)}…</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRetry(order.orderId)}
                  disabled={retrying === order.orderId}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  {retrying === order.orderId ? "처리 중..." : "재처리"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Single reject confirmation */}
      <ConfirmModal
        open={rejectTarget !== null}
        title="사용자 거부"
        description={`${rejectTarget ?? ""} 사용자를 거부하시겠습니까? 거부된 사용자는 서비스를 이용할 수 없습니다.`}
        confirmLabel="거부"
        variant="danger"
        loading={updating === rejectTarget}
        onConfirm={async () => {
          if (!rejectTarget) return;
          await handleStatusChange(rejectTarget, "rejected");
          setRejectTarget(null);
        }}
        onCancel={() => setRejectTarget(null)}
      />

      {/* Bulk reject confirmation */}
      <ConfirmModal
        open={bulkRejectConfirm}
        title="일괄 거부"
        description={`선택한 ${selected.size}명의 사용자를 모두 거부하시겠습니까? 거부된 사용자는 서비스를 이용할 수 없습니다.`}
        confirmLabel={`${selected.size}명 거부`}
        variant="danger"
        loading={bulkProcessing}
        onConfirm={async () => {
          await handleBulkReject();
          setBulkRejectConfirm(false);
        }}
        onCancel={() => setBulkRejectConfirm(false)}
      />
    </div>
  );
}
