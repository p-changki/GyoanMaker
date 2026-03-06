"use client";

import { useState, useEffect, useCallback } from "react";

interface AppUser {
  email: string;
  name: string | null;
  image: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface QuotaInfo {
  plan: "free" | "basic" | "standard" | "pro";
  flash: { limit: number; used: number; remaining: number; credits: number };
  pro: { limit: number; used: number; remaining: number; credits: number };
  storage: { limit: number | null; used: number; remaining: number | null };
  canGenerate: boolean;
}

interface SubscriptionInfo {
  tier: "free" | "basic" | "standard" | "pro";
  status: "active" | "past_due" | "canceled";
}

interface UsageSummaryData {
  totalRequests: number;
  totalPassages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
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

// ── Usage Dashboard ───────────────────────────────────

function UsageDashboard() {
  const [daily, setDaily] = useState<UsageSummaryData | null>(null);
  const [monthly, setMonthly] = useState<UsageSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/usage?period=daily").then((r) => r.json()),
      fetch("/api/admin/usage?period=monthly").then((r) => r.json()),
    ])
      .then(([d, m]) => {
        setDaily(d);
        setMonthly(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-xl p-4 animate-pulse h-24"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "오늘 요청",
      value: daily?.totalRequests ?? 0,
      unit: "회",
      sub: `${daily?.totalPassages ?? 0} 지문`,
    },
    {
      label: "오늘 토큰",
      value: ((daily?.totalTokens ?? 0) / 1000).toFixed(1),
      unit: "K",
      sub: `$${(daily?.estimatedCostUsd ?? 0).toFixed(4)}`,
    },
    {
      label: "이번 달 요청",
      value: monthly?.totalRequests ?? 0,
      unit: "회",
      sub: `${monthly?.totalPassages ?? 0} 지문`,
    },
    {
      label: "이번 달 토큰",
      value: ((monthly?.totalTokens ?? 0) / 1000).toFixed(1),
      unit: "K",
      sub: `$${(monthly?.estimatedCostUsd ?? 0).toFixed(4)}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {card.label}
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {card.value}
            <span className="text-sm font-normal text-gray-400 ml-1">
              {card.unit}
            </span>
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Quota Panel ────────────────────────────────────────

function QuotaPanel({ email }: { email: string }) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editFlash, setEditFlash] = useState("");
  const [editPro, setEditPro] = useState("");
  const [editStorage, setEditStorage] = useState("");
  const [editPlan, setEditPlan] = useState<"free" | "basic" | "standard" | "pro">(
    "free"
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [quotaRes, subRes] = await Promise.all([
        fetch(`/api/admin/users/${encodeURIComponent(email)}/quota`),
        fetch(`/api/admin/users/${encodeURIComponent(email)}/subscription`),
      ]);
      if (!quotaRes.ok) throw new Error("쿼타 조회 실패");
      if (!subRes.ok) throw new Error("구독 조회 실패");

      const quotaData = await quotaRes.json();
      const subData = await subRes.json();
      setQuota(quotaData);
      setSubscription(subData.subscription ?? null);
      setEditPlan(subData.subscription?.tier ?? "free");
      setEditFlash(String(quotaData.flash.limit));
      setEditPro(String(quotaData.pro.limit));
      setEditStorage(
        quotaData.storage.limit === null ? "" : String(quotaData.storage.limit)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const handleSave = async () => {
    const flashMonthlyLimit = parseInt(editFlash, 10);
    const proMonthlyLimit = parseInt(editPro, 10);
    const storageLimit =
      editStorage.trim().length === 0 ? null : parseInt(editStorage, 10);

    if (!Number.isFinite(flashMonthlyLimit) || flashMonthlyLimit < 0) {
      setSaveMsg("Flash 한도를 올바르게 입력하세요.");
      return;
    }
    if (!Number.isFinite(proMonthlyLimit) || proMonthlyLimit < 0) {
      setSaveMsg("Pro 한도를 올바르게 입력하세요.");
      return;
    }
    if (
      storageLimit !== null &&
      (!Number.isFinite(storageLimit) || storageLimit < 0)
    ) {
      setSaveMsg("저장 한도를 올바르게 입력하세요.");
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(email)}/quota`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashMonthlyLimit,
            proMonthlyLimit,
            storageLimit,
          }),
        }
      );
      if (!res.ok) throw new Error("쿼타 수정 실패");
      const data = await res.json();
      setQuota(data);
      setEditFlash(String(data.flash.limit));
      setEditPro(String(data.pro.limit));
      setEditStorage(data.storage.limit === null ? "" : String(data.storage.limit));
      setSaveMsg("저장 완료");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(email)}/subscription`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: editPlan }),
        }
      );
      if (!res.ok) throw new Error("플랜 수정 실패");
      const data = await res.json();
      setSubscription(data.subscription);
      setSaveMsg("플랜 저장 완료");
      setTimeout(() => setSaveMsg(null), 2000);
      await fetchQuota();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "플랜 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-400 py-2">쿼타 로딩 중...</div>;
  }

  if (error) {
    return <div className="text-xs text-red-500 py-2">{error}</div>;
  }

  if (!quota) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      {/* Current usage */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Flash 사용량
          </p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.flash.used}{" "}
            <span className="text-gray-400 font-normal">
              / {quota.flash.limit}회
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            남은 횟수: {quota.flash.remaining}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Pro 사용량
          </p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.pro.used}{" "}
            <span className="text-gray-400 font-normal">
              / {quota.pro.limit}회
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            남은 횟수: {quota.pro.remaining}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            저장 슬롯
          </p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.storage.used}{" "}
            <span className="text-gray-400 font-normal">
              / {quota.storage.limit === null ? "∞" : quota.storage.limit}
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            플랜: {quota.plan.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Edit limits */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Flash 한도
          </label>
          <input
            type="number"
            min="0"
            value={editFlash}
            onChange={(e) => setEditFlash(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Pro 한도
          </label>
          <input
            type="number"
            min="0"
            value={editPro}
            onChange={(e) => setEditPro(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            저장 한도 (빈값=무제한)
          </label>
          <input
            type="number"
            min="0"
            value={editStorage}
            onChange={(e) => setEditStorage(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shrink-0"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* Plan edit */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            구독 플랜
          </label>
          <select
            value={editPlan}
            onChange={(e) =>
              setEditPlan(
                e.target.value as "free" | "basic" | "standard" | "pro"
              )
            }
            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            <option value="free">FREE</option>
            <option value="basic">BASIC</option>
            <option value="standard">STANDARD</option>
            <option value="pro">PRO</option>
          </select>
        </div>
        <button
          type="button"
          onClick={handleSavePlan}
          disabled={saving}
          className="px-4 py-2 bg-violet-500 text-white text-xs font-bold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50 shrink-0"
        >
          플랜 저장
        </button>
      </div>

      {subscription && (
        <p className="text-xs text-gray-500">
          현재 플랜: <strong>{subscription.tier.toUpperCase()}</strong> (
          {subscription.status})
        </p>
      )}

      {saveMsg && (
        <p
          className={`text-xs font-medium ${saveMsg === "저장 완료" ? "text-green-600" : "text-red-500"}`}
        >
          {saveMsg}
        </p>
      )}
    </div>
  );
}

// ── Admin Page ─────────────────────────────────────────

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
            <span className="ml-1.5 text-xs opacity-70">
              {tabCounts[tab.key]}
            </span>
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
          {activeTab === "pending"
            ? "대기 중인 사용자가 없습니다"
            : "해당 상태의 사용자가 없습니다"}
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
                    <p className="font-semibold text-gray-900 truncate">
                      {user.name ?? "이름 없음"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
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
                          onClick={() =>
                            handleStatusChange(user.email, "approved")
                          }
                          className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
                        >
                          승인
                        </button>
                      )}
                      {user.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(user.email, "rejected")
                          }
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

              {expandedEmail === user.email && (
                <QuotaPanel email={user.email} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
