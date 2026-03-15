"use client";

import { useCallback, useEffect, useState } from "react";
import UserQuotaCards from "./management/user-detail/UserQuotaCards";
import UserCreditHistory from "./management/user-detail/UserCreditHistory";
import UserLimitEditor from "./management/user-detail/UserLimitEditor";
import UserPlanEditor from "./management/user-detail/UserPlanEditor";
import UserManualGrant from "./management/user-detail/UserManualGrant";
import UserPlanHistory from "./management/user-detail/UserPlanHistory";

interface CreditEntryInfo {
  remaining: number;
  total?: number;
  purchasedAt: string;
  expiresAt: string;
  orderId?: string;
  status?: "active" | "exhausted" | "expired";
  exhaustedAt?: string;
  expiredAt?: string;
}

interface QuotaModelStatus {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
  creditEntries?: CreditEntryInfo[];
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

  // Limit editor state
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
        fetch(`/api/users/${encodeURIComponent(email)}/quota`),
        fetch(`/api/users/${encodeURIComponent(email)}/subscription`),
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

  const handleSaveLimits = async () => {
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
      const res = await fetch(`/api/users/${encodeURIComponent(email)}/quota`, {
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
      const res = await fetch(`/api/users/${encodeURIComponent(email)}/subscription`, {
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

  if (loading) {
    return <div className="text-xs text-gray-400 py-2">할당량 로딩 중...</div>;
  }

  if (error) {
    return <div className="text-xs text-red-500 py-2">{error}</div>;
  }

  if (!quota) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      <UserQuotaCards quota={quota} />

      <UserCreditHistory
        flashEntries={quota.flash.creditEntries ?? []}
        proEntries={quota.pro.creditEntries ?? []}
        illustrationEntries={quota.illustration.creditEntries ?? []}
        email={email}
        onRevoked={fetchQuota}
      />

      <UserLimitEditor
        editFlash={editFlash}
        editPro={editPro}
        editIllustration={editIllustration}
        editStorage={editStorage}
        saving={saving}
        saveMsg={saveMsg}
        onChangeFlash={setEditFlash}
        onChangePro={setEditPro}
        onChangeIllustration={setEditIllustration}
        onChangeStorage={setEditStorage}
        onSave={handleSaveLimits}
      />

      <UserPlanEditor
        editPlan={editPlan}
        subscription={subscription}
        saving={saving}
        onChangePlan={setEditPlan}
        onSave={handleSavePlan}
      />

      <UserPlanHistory email={email} />

      <UserManualGrant email={email} onGranted={fetchQuota} />
    </div>
  );
}
