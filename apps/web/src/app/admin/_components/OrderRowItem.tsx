"use client";

import { STATUS_BADGE } from "./ordersTable.types";
import type { OrderRow } from "./ordersTable.types";
import { getOrderLabel } from "./useOrdersTable";

interface Props {
  order: OrderRow;
  isExpanded: boolean;
  onToggle: (orderId: string) => void;
  bankActionId: string | null;
  retrying: string | null;
  taxUpdating: string | null;
  onBankApprove: (orderId: string) => void;
  onBankReject: (orderId: string) => void;
  onRetry: (orderId: string) => void;
  onTaxStatusUpdate: (orderId: string, taxStatus: "issued" | "none") => void;
}

export default function OrderRowItem({
  order,
  isExpanded,
  onToggle,
  bankActionId,
  retrying,
  taxUpdating,
  onBankApprove,
  onBankReject,
  onRetry,
  onTaxStatusUpdate,
}: Props) {
  return (
    <div className="bg-white border border-gray-200/60 rounded-xl shadow-sm overflow-hidden">
      {/* ── Collapsed header ── */}
      <button
        type="button"
        onClick={() => onToggle(order.orderId)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <code className="text-xs text-gray-500 font-mono shrink-0">
            {order.orderId.slice(0, 8)}
          </code>
          <span className="text-sm text-gray-700 truncate">{order.email}</span>
          <span className="text-xs text-gray-400 shrink-0">{getOrderLabel(order)}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-gray-900">
            ₩{order.amount.toLocaleString()}
          </span>
          {order.receiptType === "tax_invoice" && (
            <span
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                order.taxStatus === "issued"
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-orange-50 text-orange-600 border-orange-200"
              }`}
            >
              {order.taxStatus === "issued" ? "세금계산서 발행완료" : "세금계산서 미발행"}
            </span>
          )}
          {order.receiptType === "cash_receipt" && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full border bg-gray-50 text-gray-500 border-gray-200">
              현금영수증
            </span>
          )}
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${
              STATUS_BADGE[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            {order.status === "awaiting_deposit" ? "입금 대기" : order.status.replace(/_/g, " ")}
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            {new Date(order.createdAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-2">
            <div>
              <span className="font-medium text-gray-600">Order ID:</span>{" "}
              <code className="font-mono">{order.orderId}</code>
            </div>
            <div>
              <span className="font-medium text-gray-600">Type:</span>{" "}
              {order.type === "plan" ? "이용권" : "크레딧 충전"}
            </div>
            <div>
              <span className="font-medium text-gray-600">Created:</span>{" "}
              {new Date(order.createdAt).toLocaleString("ko-KR")}
            </div>
            {order.confirmedAt && (
              <div>
                <span className="font-medium text-gray-600">Confirmed:</span>{" "}
                {new Date(order.confirmedAt).toLocaleString("ko-KR")}
              </div>
            )}
            {order.errorMessage && (
              <div className="col-span-2">
                <span className="font-medium text-red-600">Error:</span>{" "}
                <span className="text-red-500">{order.errorMessage}</span>
              </div>
            )}
          </div>

          {order.checkoutFlow === "bank_transfer" && order.depositorName && (
            <div className="mt-2 space-y-1">
              <div>
                <span className="font-medium text-gray-600 text-xs">입금자명:</span>{" "}
                <span className="text-xs text-gray-700 font-semibold">{order.depositorName}</span>
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full">
                  무통장입금
                </span>
              </div>
              {order.receiptType === "cash_receipt" && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">현금영수증:</span> {order.receiptPhone ?? "-"}
                </div>
              )}
              {order.receiptType === "tax_invoice" && order.taxInvoiceInfo && (
                <TaxInvoiceDetail
                  order={order}
                  taxUpdating={taxUpdating}
                  onTaxStatusUpdate={onTaxStatusUpdate}
                />
              )}
            </div>
          )}

          {order.status === "awaiting_deposit" && order.checkoutFlow === "bank_transfer" && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onBankApprove(order.orderId)}
                disabled={bankActionId === order.orderId}
                className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {bankActionId === order.orderId ? "처리 중..." : "입금 확인 (승인)"}
              </button>
              <button
                type="button"
                onClick={() => onBankReject(order.orderId)}
                disabled={bankActionId === order.orderId}
                className="px-4 py-1.5 bg-white border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                거절
              </button>
            </div>
          )}

          {order.status === "paid_not_applied" && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => onRetry(order.orderId)}
                disabled={retrying === order.orderId}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {retrying === order.orderId ? "Retrying..." : "Retry Apply"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-component: tax invoice detail ───────────────────────────────────────

function TaxInvoiceDetail({
  order,
  taxUpdating,
  onTaxStatusUpdate,
}: {
  order: OrderRow;
  taxUpdating: string | null;
  onTaxStatusUpdate: (orderId: string, taxStatus: "issued" | "none") => void;
}) {
  const info = order.taxInvoiceInfo!;
  return (
    <div className="text-xs text-gray-600 space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="font-medium">세금계산서:</span>
        <span
          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${
            order.taxStatus === "issued"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "bg-orange-50 text-orange-600 border-orange-200"
          }`}
        >
          {order.taxStatus === "issued" ? "발행 완료" : "미발행"}
        </span>
      </div>
      <div className="ml-2">
        {info.businessNumber} · {info.companyName} · {info.representative} · {info.email}
        {info.businessType && ` · ${info.businessType}`}
        {info.businessItem && ` · ${info.businessItem}`}
        {info.address && <div className="mt-0.5 text-gray-500">{info.address}</div>}
      </div>
      {order.status === "confirmed" && (
        <div className="mt-2">
          {order.taxStatus !== "issued" ? (
            <button
              type="button"
              onClick={() => onTaxStatusUpdate(order.orderId, "issued")}
              disabled={taxUpdating === order.orderId}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {taxUpdating === order.orderId ? "처리 중..." : "발행 완료 처리"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTaxStatusUpdate(order.orderId, "none")}
              disabled={taxUpdating === order.orderId}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {taxUpdating === order.orderId ? "처리 중..." : "발행 취소"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
