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
        </div>
      )}
    </div>
  );
}
