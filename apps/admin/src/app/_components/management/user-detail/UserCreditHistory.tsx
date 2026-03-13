"use client";

import { useState } from "react";

interface CreditEntryInfo {
  remaining: number;
  total?: number;
  purchasedAt: string;
  expiresAt: string;
  orderId?: string;
}

interface UserCreditHistoryProps {
  flashEntries: CreditEntryInfo[];
  proEntries: CreditEntryInfo[];
  illustrationEntries: CreditEntryInfo[];
}

type ModelLabel = "속도" | "정밀" | "삽화";

export default function UserCreditHistory({
  flashEntries,
  proEntries,
  illustrationEntries,
}: UserCreditHistoryProps) {
  const [show, setShow] = useState(false);

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
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="px-2.5 py-1.5 text-left font-semibold">유형</th>
                <th className="px-2.5 py-1.5 text-left font-semibold">구매일</th>
                <th className="px-2.5 py-1.5 text-left font-semibold">주문ID</th>
                <th className="px-2.5 py-1.5 text-right font-semibold">구매</th>
                <th className="px-2.5 py-1.5 text-right font-semibold">사용</th>
                <th className="px-2.5 py-1.5 text-right font-semibold">잔여</th>
                <th className="px-2.5 py-1.5 text-left font-semibold">만료일</th>
              </tr>
            </thead>
            <tbody>
              {allEntries.map((entry, idx) => {
                const purchased = entry.total ?? null;
                const used = purchased !== null ? purchased - entry.remaining : null;
                const isExpiringSoon = (() => {
                  try {
                    return new Date(entry.expiresAt).getTime() - Date.now() < 7 * 86400000;
                  } catch {
                    return false;
                  }
                })();
                return (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-2.5 py-1.5 font-medium text-gray-700">{entry.model}</td>
                    <td className="px-2.5 py-1.5 text-gray-600">{dateStr(entry.purchasedAt)}</td>
                    <td className="px-2.5 py-1.5 text-gray-400 font-mono truncate max-w-30">
                      {entry.orderId
                        ? entry.orderId.slice(0, 16) + (entry.orderId.length > 16 ? "…" : "")
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
                      {dateStr(entry.expiresAt)}
                      {isExpiringSoon && " ⚠"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
