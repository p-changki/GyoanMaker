"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

  // Manual bank transfer grant state
  const [showManualGrant, setShowManualGrant] = useState(false);
  const [manualPlan, setManualPlan] = useState<"free" | "basic" | "standard" | "pro">("basic");
  const [manualEndDate, setManualEndDate] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMemo, setManualMemo] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const defaultEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

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
      setSaveMsg("올바른 속도 한도를 입력하세요.");
      return;
    }
    if (!Number.isFinite(proMonthlyLimit) || proMonthlyLimit < 0) {
      setSaveMsg("올바른 정밀 한도를 입력하세요.");
      return;
    }
    if (storageLimit !== null && (!Number.isFinite(storageLimit) || storageLimit < 0)) {
      setSaveMsg("올바른 저장소 한도를 입력하세요.");
      return;
    }
    if (!Number.isFinite(illustrationMonthlyLimit) || illustrationMonthlyLimit < 0) {
      setSaveMsg("올바른 삽화 한도를 입력하세요.");
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
      setSaveMsg("저장됨");
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
      if (!res.ok) throw new Error("Failed to update plan");
      const data = (await res.json()) as { subscription: SubscriptionInfo };
      setSubscription(data.subscription);
      setSaveMsg("요금제 저장됨");
      setTimeout(() => setSaveMsg(null), 2000);
      await fetchQuota();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "요금제 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleManualGrant = async () => {
    const endDate = manualEndDate || defaultEndDate;
    setGranting(true);
    setGrantMsg(null);
    try {
      const res = await fetch("/api/admin/billing/manual-grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          planId: manualPlan,
          periodEndAt: endDate,
          amount: manualAmount.trim() ? parseInt(manualAmount, 10) : 0,
          memo: manualMemo.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? "플랜 부여 실패");
      }
      setGrantMsg({ text: `${manualPlan.toUpperCase()} 플랜 부여 완료 (만료: ${endDate})`, ok: true });
      setManualMemo("");
      setManualAmount("");
      await fetchQuota();
      setTimeout(() => setGrantMsg(null), 4000);
    } catch (err) {
      setGrantMsg({ text: err instanceof Error ? err.message : "오류 발생", ok: false });
    } finally {
      setGranting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-gray-400 py-2">할당량 로딩 중...</div>;
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
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">속도 사용량</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.flash.used} <span className="text-gray-400 font-normal">/ {quota.flash.limit}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">크레딧: {quota.flash.credits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">정밀 사용량</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.pro.used} <span className="text-gray-400 font-normal">/ {quota.pro.limit}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">크레딧: {quota.pro.credits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">삽화</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.illustration.used} <span className="text-gray-400 font-normal">/ {quota.illustration.limit}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">크레딧: {quota.illustration.credits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">저장 슬롯</p>
          <p className="text-sm font-bold text-gray-700 mt-1">
            {quota.storage.used}{" "}
            <span className="text-gray-400 font-normal">
              / {quota.storage.limit === null ? "∞" : quota.storage.limit}
            </span>
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">요금제: {quota.plan.toUpperCase()}</p>
        </div>
      </div>

      {/* Limit Editors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">속도 한도</label>
          <input
            type="number"
            min="0"
            value={editFlash}
            onChange={(e) => setEditFlash(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">정밀 한도</label>
          <input
            type="number"
            min="0"
            value={editPro}
            onChange={(e) => setEditPro(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">삽화 한도</label>
          <input
            type="number"
            min="0"
            value={editIllustration}
            onChange={(e) => setEditIllustration(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">저장소 (빈칸=∞)</label>
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
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* Plan Editor */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">구독 요금제</label>
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
          요금제 저장
        </button>
      </div>

      {subscription && (
        <p className="text-xs text-gray-500">
          현재 요금제: <strong>{subscription.tier.toUpperCase()}</strong> ({subscription.status === "active" ? "활성" : "만료"})
        </p>
      )}

      {saveMsg && (
        <p className={`text-xs font-medium ${saveMsg === "저장됨" || saveMsg === "요금제 저장됨" ? "text-green-600" : "text-red-500"}`}>
          {saveMsg}
        </p>
      )}

      {/* Manual Bank Transfer Grant */}
      <div className="pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowManualGrant((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
        >
          <span className="text-[10px]">{showManualGrant ? "▲" : "▼"}</span>
          무통장 수동 부여
        </button>

        {showManualGrant && (
          <div className="mt-3 space-y-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
            <p className="text-[10px] text-purple-600 font-medium">
              플랜 부여 후 billing_orders에 수동 기록이 생성됩니다.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  플랜
                </label>
                <select
                  value={manualPlan}
                  onChange={(e) => setManualPlan(e.target.value as typeof manualPlan)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                >
                  <option value="basic">BASIC</option>
                  <option value="standard">STANDARD</option>
                  <option value="pro">PRO</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  만료일
                </label>
                <input
                  type="date"
                  value={manualEndDate || defaultEndDate}
                  onChange={(e) => setManualEndDate(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  입금액 (원, 선택)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  메모 (선택)
                </label>
                <input
                  type="text"
                  placeholder="입금자명, 특이사항 등"
                  value={manualMemo}
                  onChange={(e) => setManualMemo(e.target.value)}
                  maxLength={200}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualGrant}
              disabled={granting}
              className="w-full px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {granting ? "처리 중..." : "플랜 부여 + 기록 저장"}
            </button>

            {grantMsg && (
              <p className={`text-xs font-medium ${grantMsg.ok ? "text-green-600" : "text-red-500"}`}>
                {grantMsg.text}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
