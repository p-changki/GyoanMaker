"use client";

import { useState } from "react";

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

interface UserCreditHistoryProps {
  flashEntries: CreditEntryInfo[];
  proEntries: CreditEntryInfo[];
  illustrationEntries: CreditEntryInfo[];
}

type ModelLabel = "속도" | "정밀" | "삽화";
type FilterTab = "all" | "active" | "exhausted" | "expired";

const STATUS_BADGE: Record<
  "active" | "exhausted" | "expired",
  { label: string; className: string }
> = {
  active: { label: "활성", className: "bg-green-50 text-green-600" },
  exhausted: { label: "소진", className: "bg-gray-100 text-gray-500" },
  expired: { label: "만료", className: "bg-red-50 text-red-500" },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "active", label: "활성" },
  { key: "exhausted", label: "소진" },
  { key: "expired", label: "만료" },
];

/** Derive status from entry — pure function (no Date.now inside render) */
function resolveStatus(
  entry: CreditEntryInfo,
  nowMs: number,
): "active" | "exhausted" | "expired" {
  if (entry.status) return entry.status;
  if (entry.remaining === 0) return "exhausted";
  try {
    if (new Date(entry.expiresAt).getTime() < nowMs) return "expired";
  } catch {
    // ignore
  }
  return "active";
}

export default function UserCreditHistory({
  flashEntries,
  proEntries,
  illustrationEntries,
  email,
  onRevoked,
}: UserCreditHistoryProps & { email: string; onRevoked?: () => void }) {
  const [show, setShow] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (orderId: string, model: ModelLabel) => {
    if (!confirm(`이 크레딧을 회수하시겠습니까? (주문ID: ${orderId})`)) return;
    const typeMap: Record<ModelLabel, string> = { "속도": "flash", "정밀": "pro", "삽화": "illustration" };
    setRevoking(orderId);
    try {
      const res = await fetch("/api/billing/revoke-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: typeMap[model], orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: { message?: string } })?.error?.message ?? "회수 실패");
      }
      onRevoked?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "회수 실패");
    } finally {
      setRevoking(null);
    }
  };
  // Capture current time once (useState initializer runs only on mount)
  const [nowMs] = useState(() => Date.now());

  const allEntries: (CreditEntryInfo & { model: ModelLabel })[] = [
    ...flashEntries.map((e) => ({ ...e, model: "속도" as ModelLabel })),
    ...proEntries.map((e) => ({ ...e, model: "정밀" as ModelLabel })),
    ...illustrationEntries.map((e) => ({ ...e, model: "삽화" as ModelLabel })),
  ];

  if (allEntries.length === 0) return null;

  const dateStr = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("ko-KR");
    } catch {
      return iso;
    }
  };

  const filteredEntries = allEntries.filter((entry) => {
    if (activeFilter === "all") return true;
    return resolveStatus(entry, nowMs) === activeFilter;
  });

  // Summary stats per model
  const modelLabels: ModelLabel[] = ["속도", "정밀", "삽화"];
  const summaryByModel = modelLabels.map((model) => {
    const entries = allEntries.filter((e) => e.model === model);
    if (entries.length === 0) return null;
    return {
      model,
      purchased: entries.reduce((sum, e) => sum + (e.total ?? 0), 0),
      remaining: entries
        .filter((e) => resolveStatus(e, nowMs) === "active")
        .reduce((sum, e) => sum + e.remaining, 0),
      count: entries.length,
    };
  }).filter(Boolean) as { model: ModelLabel; purchased: number; remaining: number; count: number }[];

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
      >
        <span className="text-[10px]">{show ? "▲" : "▼"}</span>
        크레딧 구매 내역 ({allEntries.length}건)
      </button>

      {show && (
        <div className="mt-2 space-y-2">
          {/* Summary stats per model */}
          {summaryByModel.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {summaryByModel.map((s) => (
                <div
                  key={s.model}
                  className="rounded-md bg-gray-50 border border-gray-200 px-2 py-1.5 text-center"
                >
                  <div className="text-gray-400">{s.model}</div>
                  <div className="font-bold text-gray-700">
                    <span className="text-green-600">{s.remaining}</span>
                    <span className="text-gray-400"> / {s.purchased}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{s.count}건</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1">
            {FILTER_TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? allEntries.length
                  : allEntries.filter((e) => resolveStatus(e, nowMs) === tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    activeFilter === tab.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {tab.label} {count > 0 && <span className="opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="px-2.5 py-1.5 text-left font-semibold">유형</th>
                  <th className="px-2.5 py-1.5 text-left font-semibold">상태</th>
                  <th className="px-2.5 py-1.5 text-left font-semibold">구매일</th>
                  <th className="px-2.5 py-1.5 text-left font-semibold">주문ID</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold">구매</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold">사용</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold">잔여</th>
                  <th className="px-2.5 py-1.5 text-left font-semibold">만료일</th>
                  <th className="px-2.5 py-1.5 text-left font-semibold">소진일</th>
                  <th className="px-2.5 py-1.5 text-center font-semibold">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-2.5 py-3 text-center text-gray-400"
                    >
                      해당 항목 없음
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, idx) => {
                    const status = resolveStatus(entry, nowMs);
                    const purchased = entry.total ?? null;
                    const used = purchased !== null ? purchased - entry.remaining : null;
                    const isInactive = status === "exhausted" || status === "expired";
                    const isExpiringSoon =
                      status === "active" &&
                      (() => {
                        try {
                          return (
                            new Date(entry.expiresAt).getTime() - Date.now() < 7 * 86400000
                          );
                        } catch {
                          return false;
                        }
                      })();
                    const badge = STATUS_BADGE[status];

                    return (
                      <tr
                        key={idx}
                        className={`border-t border-gray-100 hover:bg-gray-50/50 ${isInactive ? "opacity-60" : ""}`}
                      >
                        <td className="px-2.5 py-1.5 font-medium text-gray-700">
                          {entry.model}
                        </td>
                        <td className="px-2.5 py-1.5">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-gray-600">
                          {dateStr(entry.purchasedAt)}
                        </td>
                        <td className="px-2.5 py-1.5 text-gray-400 font-mono truncate max-w-30">
                          {entry.orderId
                            ? entry.orderId.slice(0, 16) +
                              (entry.orderId.length > 16 ? "…" : "")
                            : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-bold text-gray-700">
                          {purchased !== null ? purchased : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right text-orange-600 font-medium">
                          {used !== null ? used : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-bold text-green-600">
                          {entry.remaining}
                        </td>
                        <td
                          className={`px-2.5 py-1.5 ${
                            isExpiringSoon ? "text-red-500 font-semibold" : "text-gray-600"
                          }`}
                        >
                          {entry.expiredAt
                            ? dateStr(entry.expiredAt)
                            : dateStr(entry.expiresAt)}
                          {isExpiringSoon && " ⚠"}
                        </td>
                        <td className="px-2.5 py-1.5 text-gray-400">
                          {entry.exhaustedAt ? dateStr(entry.exhaustedAt) : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-center">
                          {entry.orderId && status === "active" ? (
                            <button
                              type="button"
                              onClick={() => handleRevoke(entry.orderId!, entry.model)}
                              disabled={revoking === entry.orderId}
                              className="px-2 py-0.5 text-[10px] font-semibold text-red-500 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              {revoking === entry.orderId ? "..." : "회수"}
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
