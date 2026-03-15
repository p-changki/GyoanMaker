"use client";

import { useCallback, useEffect, useState } from "react";

interface PlanHistoryRow {
  id: string;
  fromTier: string;
  toTier: string;
  fromStatus: string;
  toStatus: string;
  changedBy: "system" | "admin" | "user";
  reason: string;
  changedAt: string;
}

const TIER_LABEL: Record<string, string> = {
  free: "FREE",
  basic: "BASIC",
  standard: "STANDARD",
  pro: "PRO",
};

const REASON_LABEL: Record<string, string> = {
  plan_change: "플랜 변경",
  admin_manual: "관리자 수동",
  manual_grant: "수동 부여",
  payment_confirmed: "결제 확인",
  downgrade: "다운그레이드",
  expired: "만료",
  canceled: "구독 취소",
};

const CHANGED_BY_LABEL: Record<string, string> = {
  system: "시스템",
  admin: "관리자",
  user: "사용자",
};

function dateStr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ko-KR");
  } catch {
    return iso;
  }
}

export default function UserPlanHistory({ email }: { email: string }) {
  const [show, setShow] = useState(false);
  const [history, setHistory] = useState<PlanHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(email)}/plan-history`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { history: PlanHistoryRow[] };
      setHistory(data.history);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (show && history.length === 0) {
      fetchHistory();
    }
  }, [show, history.length, fetchHistory]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        {show ? "▲" : "▼"} 플랜 변경 이력
      </button>

      {show && (
        <div className="mt-2">
          {loading ? (
            <p className="text-xs text-gray-400">로딩 중...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-gray-400">변경 이력이 없습니다</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="px-2.5 py-1.5 text-left font-semibold">
                      날짜
                    </th>
                    <th className="px-2.5 py-1.5 text-left font-semibold">
                      변경
                    </th>
                    <th className="px-2.5 py-1.5 text-left font-semibold">
                      사유
                    </th>
                    <th className="px-2.5 py-1.5 text-left font-semibold">
                      변경자
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 hover:bg-gray-50/50"
                    >
                      <td className="px-2.5 py-1.5 text-gray-600 whitespace-nowrap">
                        {dateStr(row.changedAt)}
                      </td>
                      <td className="px-2.5 py-1.5 font-medium text-gray-700">
                        {TIER_LABEL[row.fromTier] ?? row.fromTier} →{" "}
                        {TIER_LABEL[row.toTier] ?? row.toTier}
                      </td>
                      <td className="px-2.5 py-1.5 text-gray-600">
                        {REASON_LABEL[row.reason] ?? row.reason}
                      </td>
                      <td className="px-2.5 py-1.5 text-gray-500">
                        {CHANGED_BY_LABEL[row.changedBy] ?? row.changedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
