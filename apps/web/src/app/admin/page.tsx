"use client";

import { useCallback, useEffect, useState } from "react";
import QuotaPanel from "./_components/QuotaPanel";
import UsageDashboard from "./_components/UsageDashboard";

interface AppUser {
  email: string;
  name: string | null;
  image: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

type Tab = "all" | "pending" | "approved" | "rejected";

const TAB_CONFIG: { key: Tab; label: string; color: string }[] = [
  { key: "all", label: "전체", color: "bg-gray-100 text-gray-700" },
  { key: "pending", label: "대기 중", color: "bg-amber-100 text-amber-700" },
  { key: "approved", label: "승인됨", color: "bg-green-100 text-green-700" },
  { key: "rejected", label: "거부됨", color: "bg-red-100 text-red-700" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  approved: "승인됨",
  rejected: "거부됨",
};

export default function AdminPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("사용자 목록을 불러올 수 없습니다");
      const data = await res.json();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (
    email: string,
    status: "approved" | "rejected" | "pending"
  ) => {
    setUpdating(email);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경 실패");
    } finally {
      setUpdating(null);
    }
  };

  const toggleQuota = (email: string) => {
    setExpandedEmail((prev) => (prev === email ? null : email));
  };

  const filteredUsers =
    activeTab === "all" ? users : users.filter((u) => u.status === activeTab);

  const tabCounts = {
    all: users.length,
    pending: users.filter((u) => u.status === "pending").length,
    approved: users.filter((u) => u.status === "approved").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">사용자 관리</h1>
        <p className="mt-1 text-gray-500">사용자 승인 및 쿼타를 관리합니다</p>
      </div>

      <UsageDashboard />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? `${tab.color} shadow-sm scale-[1.02]`
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          불러오는 중...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {activeTab === "pending" ? "대기 중인 사용자가 없습니다" : "해당 상태의 사용자가 없습니다"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.email}
              className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user.name ?? "이름 없음"}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-3 py-1 text-xs font-semibold border rounded-full ${STATUS_BADGE[user.status]}`}
                  >
                    {STATUS_LABEL[user.status]}
                  </span>

                  {updating === user.email ? (
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                    <div className="flex gap-2">
                      {user.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(user.email, "approved")}
                          className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
                        >
                          승인
                        </button>
                      )}
                      {user.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(user.email, "rejected")}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                        >
                          거부
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleQuota(user.email)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          expandedEmail === user.email
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        쿼타
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {expandedEmail === user.email && <QuotaPanel email={user.email} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
