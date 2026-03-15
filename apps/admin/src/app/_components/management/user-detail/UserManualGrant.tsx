"use client";

import { useMemo, useState } from "react";

interface UserManualGrantProps {
  email: string;
  onGranted: () => void;
}

export default function UserManualGrant({ email, onGranted }: UserManualGrantProps) {
  const [show, setShow] = useState(false);
  const [manualPlan, setManualPlan] = useState<"basic" | "standard" | "pro">("basic");
  const [manualEndDate, setManualEndDate] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMemo, setManualMemo] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Credit grant state
  const [creditType, setCreditType] = useState<"flash" | "pro" | "illustration">("illustration");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditGranting, setCreditGranting] = useState(false);
  const [creditMsg, setCreditMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const defaultEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const handleGrant = async () => {
    const endDate = manualEndDate || defaultEndDate;
    setGranting(true);
    setGrantMsg(null);
    try {
      const res = await fetch("/api/billing/manual-grant", {
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
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? "플랜 부여 실패"
        );
      }
      setGrantMsg({
        text: `${manualPlan.toUpperCase()} 플랜 부여 완료 (만료: ${endDate})`,
        ok: true,
      });
      setManualMemo("");
      setManualAmount("");
      onGranted();
      setTimeout(() => setGrantMsg(null), 4000);
    } catch (err) {
      setGrantMsg({ text: err instanceof Error ? err.message : "오류 발생", ok: false });
    } finally {
      setGranting(false);
    }
  };

  const handleCreditGrant = async () => {
    const amount = parseInt(creditAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCreditMsg({ text: "올바른 수량을 입력하세요.", ok: false });
      return;
    }
    setCreditGranting(true);
    setCreditMsg(null);
    try {
      const res = await fetch("/api/billing/manual-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: creditType, amount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? "크레딧 부여 실패",
        );
      }
      const typeLabel = creditType === "flash" ? "속도" : creditType === "pro" ? "정밀" : "삽화";
      setCreditMsg({ text: `${typeLabel} ${amount}건 부여 완료`, ok: true });
      setCreditAmount("");
      onGranted();
      setTimeout(() => setCreditMsg(null), 4000);
    } catch (err) {
      setCreditMsg({ text: err instanceof Error ? err.message : "오류 발생", ok: false });
    } finally {
      setCreditGranting(false);
    }
  };

  return (
    <div className="pt-3 border-t border-gray-100">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
      >
        <span className="text-[10px]">{show ? "▲" : "▼"}</span>
        무통장 수동 부여
      </button>

      {show && (
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
                onChange={(e) =>
                  setManualPlan(e.target.value as "basic" | "standard" | "pro")
                }
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
            onClick={handleGrant}
            disabled={granting}
            className="w-full px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {granting ? "처리 중..." : "플랜 부여 + 기록 저장"}
          </button>
          {grantMsg && (
            <p
              className={`text-xs font-medium ${
                grantMsg.ok ? "text-green-600" : "text-red-500"
              }`}
            >
              {grantMsg.text}
            </p>
          )}

          {/* Credit grant section */}
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-[10px] text-purple-600 font-medium mb-2">
              크레딧 수동 부여
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  유형
                </label>
                <select
                  value={creditType}
                  onChange={(e) =>
                    setCreditType(e.target.value as "flash" | "pro" | "illustration")
                  }
                  className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                >
                  <option value="flash">속도</option>
                  <option value="pro">정밀</option>
                  <option value="illustration">삽화</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  수량
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreditGrant}
                  disabled={creditGranting}
                  className="w-full px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {creditGranting ? "처리 중..." : "크레딧 부여"}
                </button>
              </div>
            </div>
            {creditMsg && (
              <p
                className={`mt-1 text-xs font-medium ${
                  creditMsg.ok ? "text-green-600" : "text-red-500"
                }`}
              >
                {creditMsg.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
