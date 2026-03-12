"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QuotaPanel from "./QuotaPanel";

interface AppUser {
  email: string;
  name: string | null;
  image: string | null;
  status: "pending" | "approved" | "rejected" | "deleted";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "deleted";
type SortMode = "newest" | "name";

const FILTER_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: "all", label: "전체", color: "bg-gray-100 text-gray-700" },
  { key: "pending", label: "대기", color: "bg-amber-100 text-amber-700" },
  { key: "approved", label: "승인", color: "bg-green-100 text-green-700" },
  { key: "rejected", label: "거부", color: "bg-red-100 text-red-700" },
  { key: "deleted", label: "탈퇴", color: "bg-gray-200 text-gray-600" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  deleted: "bg-gray-100 text-gray-500 border-gray-300",
};

export default function AdminUsersTab() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("사용자 목록 불러오기 실패");
      const data = (await res.json()) as { users: AppUser[] };
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(deleteTarget)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제 실패");
      setDeleteTarget(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  const tabCounts = useMemo(
    () => ({
      all: users.length,
      pending: users.filter((u) => u.status === "pending").length,
      approved: users.filter((u) => u.status === "approved").length,
      rejected: users.filter((u) => u.status === "rejected").length,
      deleted: users.filter((u) => u.status === "deleted").length,
    }),
    [users]
  );

  const displayUsers = useMemo(() => {
    let result = filter === "all" ? users : users.filter((u) => u.status === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name ?? "").toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    if (sortMode === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      sorted.sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
    }
    return sorted;
  }, [users, filter, search, sortMode]);

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Search</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setSortMode("newest")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              sortMode === "newest" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            최신순
          </button>
          <button
            type="button"
            onClick={() => setSortMode("name")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              sortMode === "name" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            이름순
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.key
                ? `${tab.color} shadow-sm scale-[1.02]`
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          로딩 중...
        </div>
      ) : displayUsers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? "검색 결과 없음" : filter === "pending" ? "대기 중인 사용자 없음" : "해당 상태의 사용자 없음"}
        </div>
      ) : (
        <div className="space-y-3">
          {displayUsers.map((user) => (
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
                  <span className={`px-3 py-1 text-xs font-semibold border rounded-full ${STATUS_BADGE[user.status] ?? ""}`}>
                    {user.status === "approved" ? "승인" : user.status === "pending" ? "대기" : user.status === "deleted" ? "탈퇴" : "거부"}
                  </span>

                  {updating === user.email ? (
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                    <div className="flex gap-2">
                      {user.status === "deleted" ? (
                        // Deleted users: restore or hard-delete
                        <>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(user.email, "approved")}
                            className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
                          >
                            복구
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user.email)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            영구삭제
                          </button>
                        </>
                      ) : (
                        <>
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
                            onClick={() => setExpandedEmail((prev) => (prev === user.email ? null : user.email))}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                              expandedEmail === user.email
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            할당량
                          </button>
                          {(user.status === "pending" || user.status === "rejected") && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(user.email)}
                              className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              삭제
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {expandedEmail === user.email && <QuotaPanel email={user.email} />}
            </div>
          ))}
        </div>
      )}
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-gray-900 mb-2">사용자 삭제</h3>
            <p className="text-sm text-gray-600 mb-1">
              아래 계정과 모든 데이터(교안 등)가 <span className="font-semibold text-red-600">영구 삭제</span>됩니다.
            </p>
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-5 break-all">{deleteTarget}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
