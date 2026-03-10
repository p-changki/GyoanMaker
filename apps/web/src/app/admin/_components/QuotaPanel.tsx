"use client";

import { useCallback, useEffect, useState } from "react";

interface QuotaModelStatus {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
}

interface QuotaInfo {
  plan: "free" | "basic" | "standard" | "pro";
  flash: QuotaModelStatus;
  pro: QuotaModelStatus;
  storage: { limit: number | null; used: number; remaining: number | null };
  illustration: QuotaModelStatus;
  canGenerate: boolean;
}

interface SubscriptionInfo {
  tier: "free" | "basic" | "standard" | "pro";
  status: "active" | "expired";
}

export default function QuotaPanel({ email }: { email: string }) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editFlash, setEditFlash] = useState("");
  const [editPro, setEditPro] = useState("");
  const [editStorage, setEditStorage] = useState("");
  const [editIllustration, setEditIllustration] = useState("");
  const [editPlan, setEditPlan] = useState<"free" | "basic" | "standard" | "pro">("free");
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
      if (!quotaRes.ok) throw new Error("Failed to fetch quota");
      if (!subRes.ok) throw new Error("Failed to fetch subscription");

      const quotaData = (await quotaRes.json()) as QuotaInfo;
      const subData = (await subRes.json()) as { subscription?: SubscriptionInfo };
      setQuota(quotaData);
      setSubscription(subData.subscription ?? null);
      setEditPlan(subData.subscription?.tier ?? "free");
      setEditFlash(String(quotaData.flash.limit));
      setEditPro(String(quotaData.pro.limit));
      setEditStorage(quotaData.storage.limit === null ? "" : String(quotaData.storage.limit));
      setEditIllustration(String(quotaData.illustration.limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
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
    const illustrationMonthlyLimit = parseInt(editIllustration, 10);

    if (!Number.isFinite(flashMonthlyLimit) || flashMonthlyLimit < 0) {
      setSaveMsg("Please enter a valid Flash limit.");
      return;
    }
    if (!Number.isFinite(proMonthlyLimit) || proMonthlyLimit < 0) {
      setSaveMsg("Please enter a valid Pro limit.");
      return;
    }
    if (storageLimit !== null && (!Number.isFinite(storageLimit) || storageLimit < 0)) {
      setSaveMsg("Please enter a valid storage limit.");
      return;
    }
    if (!Number.isFinite(illustrationMonthlyLimit) || illustrationMonthlyLimit < 0) {
      setSaveMsg("Please enter a valid illustration limit.");
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
          illustrationMonthlyLimit,
        }),
      });
      if (!res.ok) throw new Error("Failed to update quota");
      const data = (await res.json()) as QuotaInfo;
      setQuota(data);
      setEditFlash(String(data.flash.limit));
      setEditPro(String(data.pro.limit));
      setEditStorage(data.storage.limit === null ? "" : String(data.storage.limit));
      setEditIllustration(String(data.illustration.limit));
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed");
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
      if (!res.ok) throw new Error("Failed to update plan");
      const data = (await res.json()) as { subscription: SubscriptionInfo };
      setSubscription(data.subscription);
      setSaveMsg("Plan saved");
      setTimeout(() => setSaveMsg(null), 2000);
      await fetchQuota();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Plan save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-400 py-2">Loading quota...</div>;
  }

  if (error) {
    return <div className="text-xs text-red-500 py-2">{error}</div>;
  }

  if (!quota) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      {/* Usage Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Speed Usage</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.flash.used} <span className="text-gray-400 font-normal">/ {quota.flash.limit}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Credits: {quota.flash.credits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Precision Usage</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.pro.used} <span className="text-gray-400 font-normal">/ {quota.pro.limit}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Credits: {quota.pro.credits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Illustration</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.illustration.used} <span className="text-gray-400 font-normal">/ {quota.illustration.limit}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Credits: {quota.illustration.credits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Storage Slots</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.storage.used}{" "}
            <span className="text-gray-400 font-normal">
              / {quota.storage.limit === null ? "∞" : quota.storage.limit}
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Plan: {quota.plan.toUpperCase()}</p>
        </div>
      </div>

      {/* Limit Editors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Speed Limit</label>
          <input
            type="number"
            min="0"
            value={editFlash}
            onChange={(e) => setEditFlash(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Precision Limit</label>
          <input
            type="number"
            min="0"
            value={editPro}
            onChange={(e) => setEditPro(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Illustration Limit</label>
          <input
            type="number"
            min="0"
            value={editIllustration}
            onChange={(e) => setEditIllustration(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Storage (empty=∞)</label>
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
          className="px-4 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shrink-0 h-[34px]"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Plan Editor */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subscription Plan</label>
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
          Save Plan
        </button>
      </div>

      {subscription && (
        <p className="text-xs text-gray-500">
          Current plan: <strong>{subscription.tier.toUpperCase()}</strong> ({subscription.status})
        </p>
      )}

      {saveMsg && (
        <p className={`text-xs font-medium ${saveMsg === "Saved" || saveMsg === "Plan saved" ? "text-green-600" : "text-red-500"}`}>
          {saveMsg}
        </p>
      )}
    </div>
  );
}
