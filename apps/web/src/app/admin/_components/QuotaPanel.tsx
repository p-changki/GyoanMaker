"use client";

import { useCallback, useEffect, useState } from "react";

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

export default function QuotaPanel({ email }: { email: string }) {
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
      setEditStorage(quotaData.storage.limit === null ? "" : String(quotaData.storage.limit));
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
    const storageLimit = editStorage.trim().length === 0 ? null : parseInt(editStorage, 10);

    if (!Number.isFinite(flashMonthlyLimit) || flashMonthlyLimit < 0) {
      setSaveMsg("Flash 한도를 올바르게 입력하세요.");
      return;
    }
    if (!Number.isFinite(proMonthlyLimit) || proMonthlyLimit < 0) {
      setSaveMsg("Pro 한도를 올바르게 입력하세요.");
      return;
    }
    if (storageLimit !== null && (!Number.isFinite(storageLimit) || storageLimit < 0)) {
      setSaveMsg("저장 한도를 올바르게 입력하세요.");
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/quota`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashMonthlyLimit,
          proMonthlyLimit,
          storageLimit,
        }),
      });
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
      const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: editPlan }),
      });
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
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Flash 사용량
          </p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.flash.used}{" "}
            <span className="text-gray-400 font-normal">/ {quota.flash.limit}회</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">남은 횟수: {quota.flash.remaining}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Pro 사용량
          </p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.pro.used}{" "}
            <span className="text-gray-400 font-normal">/ {quota.pro.limit}회</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">남은 횟수: {quota.pro.remaining}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">저장 슬롯</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.storage.used}{" "}
            <span className="text-gray-400 font-normal">
              / {quota.storage.limit === null ? "∞" : quota.storage.limit}
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">플랜: {quota.plan.toUpperCase()}</p>
        </div>
      </div>

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
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pro 한도</label>
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

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">구독 플랜</label>
          <select
            value={editPlan}
            onChange={(e) => setEditPlan(e.target.value as "free" | "basic" | "standard" | "pro")}
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
          현재 플랜: <strong>{subscription.tier.toUpperCase()}</strong> ({subscription.status})
        </p>
      )}

      {saveMsg && (
        <p className={`text-xs font-medium ${saveMsg === "저장 완료" ? "text-green-600" : "text-red-500"}`}>
          {saveMsg}
        </p>
      )}
    </div>
  );
}
