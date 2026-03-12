"use client";

import { STATUS_TABS } from "./ordersTable.types";
import { useOrdersTable, exportTaxInvoiceCsv } from "./useOrdersTable";
import OrderRowItem from "./OrderRowItem";

export default function OrdersTable() {
  const {
    allOrders,
    loading,
    activeFilter,
    flowFilter,
    taxFilter,
    receiptFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    expandedId,
    retrying,
    taxUpdating,
    cashReceiptUpdating,
    bankActionId,
    currentPage,
    pagedOrders,
    filteredOrders,
    tabCounts,
    taxInvoicePendingCount,
    cashReceiptPendingCount,
    flowCounts,
    totalPages,
    setCurrentPage,
    toggleExpanded,
    handleFilterChange,
    handleFlowFilterChange,
    handleTaxFilterChange,
    handleReceiptFilterChange,
    handleDateRangeChange,
    handleAmountRangeChange,
    handleRetry,
    handleBankApprove,
    handleBankReject,
    handleTaxStatusUpdate,
    handleCashReceiptStatusUpdate,
  } = useOrdersTable();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Billing Orders</h2>
            {!loading && tabCounts.awaiting_deposit > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                입금 대기 {tabCounts.awaiting_deposit}건
              </span>
            )}
            {!loading && taxInvoicePendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                세금계산서 미발행 {taxInvoicePendingCount}건
              </span>
            )}
            {!loading && cashReceiptPendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                현금영수증 미발행 {cashReceiptPendingCount}건
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Recent payment orders</p>
        </div>
        <button
          type="button"
          onClick={() => exportTaxInvoiceCsv(allOrders)}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          세금계산서 CSV 내보내기
        </button>
      </div>

      {/* Checkout flow filter */}
      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(["all", "card", "bank_transfer"] as const).map((key) => {
          const label = key === "all" ? "전체" : key === "card" ? "카드결제" : "무통장입금";
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleFlowFilterChange(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                flowFilter === key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {!loading && (
                <span className="ml-1 text-[10px] opacity-60">{flowCounts[key]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tax invoice filter */}
      <div className="flex items-center gap-1 rounded-lg bg-blue-50 p-1 w-fit">
        {(["all", "tax_invoice_pending", "tax_invoice_issued"] as const).map((key) => {
          const label =
            key === "all" ? "전체" : key === "tax_invoice_pending" ? "세금계산서 미발행" : "발행 완료";
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTaxFilterChange(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                taxFilter === key
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-blue-400 hover:text-blue-600"
              }`}
            >
              {label}
              {!loading && key === "tax_invoice_pending" && taxInvoicePendingCount > 0 && (
                <span className="ml-1 text-[10px] opacity-70">{taxInvoicePendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cash receipt filter */}
      <div className="flex items-center gap-1 rounded-lg bg-teal-50 p-1 w-fit">
        {(["all", "cash_receipt_pending", "cash_receipt_issued"] as const).map((key) => {
          const label =
            key === "all" ? "전체" : key === "cash_receipt_pending" ? "현금영수증 미발행" : "발행 완료";
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleReceiptFilterChange(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                receiptFilter === key
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-teal-400 hover:text-teal-600"
              }`}
            >
              {label}
              {!loading && key === "cash_receipt_pending" && cashReceiptPendingCount > 0 && (
                <span className="ml-1 text-[10px] opacity-70">{cashReceiptPendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Date & Amount range filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">날짜 (생성일)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleDateRangeChange(e.target.value, dateTo)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <span className="text-xs text-gray-400">~</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleDateRangeChange(dateFrom, e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">금액 (원)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="최소"
              value={amountMin}
              onChange={(e) => handleAmountRangeChange(e.target.value, amountMax)}
              className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-400">~</span>
            <input
              type="number"
              placeholder="최대"
              value={amountMax}
              onChange={(e) => handleAmountRangeChange(amountMin, e.target.value)}
              className="w-24 px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
        {(dateFrom || dateTo || amountMin || amountMax) && (
          <button
            type="button"
            onClick={() => { handleDateRangeChange("", ""); handleAmountRangeChange("", ""); }}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === tab.key
                ? `${tab.color} shadow-sm`
                : "bg-gray-50 text-gray-400 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {!loading && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/60">
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found</div>
      ) : (
        <>
          <div className="space-y-2">
            {pagedOrders.map((order) => (
              <OrderRowItem
                key={order.orderId}
                order={order}
                isExpanded={expandedId === order.orderId}
                onToggle={toggleExpanded}
                bankActionId={bankActionId}
                retrying={retrying}
                taxUpdating={taxUpdating}
                onBankApprove={handleBankApprove}
                onBankReject={handleBankReject}
                onRetry={handleRetry}
                onTaxStatusUpdate={handleTaxStatusUpdate}
                cashReceiptUpdating={cashReceiptUpdating}
                onCashReceiptStatusUpdate={handleCashReceiptStatusUpdate}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-7 px-1.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    page === currentPage ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
