"use client";

import { useEffect, useState } from "react";
import UsageDashboard from "./UsageDashboard";
import BillingSummary from "./BillingSummary";

interface AppUser {
  email: string;
  name: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

type AdminTab = "overview" | "users" | "billing" | "settings";

interface AdminOverviewTabProps {
  onNavigate: (tab: AdminTab) => void;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export default function AdminOverviewTab({ onNavigate }: AdminOverviewTabProps) {
  const [recentUsers, setRecentUsers] = useState<AppUser[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [paidNotApplied, setPaidNotApplied] = useState(0);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data: { users: AppUser[] }) => {
        const sorted = [...data.users].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentUsers(sorted.slice(0, 5));
        setPendingCount(data.users.filter((u) => u.status === "pending").length);
      })
      .catch(() => {});

    fetch("/api/admin/billing/summary")
      .then((r) => r.json())
      .then((data: { paidNotAppliedCount?: number }) => {
        if (typeof data.paidNotAppliedCount === "number") {
          setPaidNotApplied(data.paidNotAppliedCount);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(pendingCount > 0 || paidNotApplied > 0) && (
        <div className="space-y-2">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("users")}
              className="w-full flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left hover:bg-amber-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Pending users</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {pendingCount}명의 사용자가 승인 대기 중
                </p>
                <p className="text-xs text-amber-600">클릭하여 사용자 탭에서 확인</p>
              </div>
            </button>
          )}

          {paidNotApplied > 0 && (
            <button
              type="button"
              onClick={() => onNavigate("billing")}
              className="w-full flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left hover:bg-red-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <title>Payment issue</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-red-800">
                  {paidNotApplied}건의 결제가 미적용 상태
                </p>
                <p className="text-xs text-red-600">클릭하여 빌링 탭에서 확인</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Usage & Billing Stats */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">사용량</h2>
        <UsageDashboard />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">빌링</h2>
        <BillingSummary />
      </div>

      {/* Recent Users */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">최근 사용자</h2>
          <button
            type="button"
            onClick={() => onNavigate("users")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            전체 보기
          </button>
        </div>
        {recentUsers.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">사용자 없음</p>
        ) : (
          <div className="bg-white border border-gray-200/60 rounded-2xl divide-y divide-gray-100 overflow-hidden">
            {recentUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.name ?? "이름 없음"}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${STATUS_BADGE[user.status]}`}>
                    {user.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
