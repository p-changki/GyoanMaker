export interface TaxInvoiceInfo {
  businessNumber: string;
  companyName: string;
  representative: string;
  email: string;
  businessType?: string;
  businessItem?: string;
  address?: string;
}

export interface OrderRow {
  orderId: string;
  email: string;
  type: "plan" | "topup";
  planId: string | null;
  packageId: string | null;
  amount: number;
  status: string;
  createdAt: string;
  confirmedAt: string | null;
  failedAt: string | null;
  paidNotAppliedAt: string | null;
  errorMessage: string | null;
  checkoutFlow: string | null;
  depositorName: string | null;
  receiptType: string | null;
  receiptPhone: string | null;
  taxInvoiceInfo: TaxInvoiceInfo | null;
  taxStatus: "none" | "pending" | "issued";
  taxStatusUpdatedAt: string | null;
}

export type StatusFilter =
  | "all"
  | "confirmed"
  | "paid_not_applied"
  | "failed"
  | "pending"
  | "awaiting_deposit";

export type FlowFilter = "all" | "card" | "bank_transfer";
export type TaxFilter = "all" | "tax_invoice_pending" | "tax_invoice_issued";

export const STATUS_TABS: { key: StatusFilter; label: string; color: string }[] = [
  { key: "all", label: "전체", color: "bg-gray-100 text-gray-700" },
  { key: "awaiting_deposit", label: "입금 대기", color: "bg-purple-100 text-purple-700" },
  { key: "confirmed", label: "확인됨", color: "bg-green-100 text-green-700" },
  { key: "paid_not_applied", label: "결제 미적용", color: "bg-red-100 text-red-700" },
  { key: "failed", label: "실패", color: "bg-orange-100 text-orange-700" },
  { key: "pending", label: "대기", color: "bg-amber-100 text-amber-700" },
];

export const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  awaiting_deposit: "bg-purple-50 text-purple-600 border-purple-200",
  confirmed: "bg-green-50 text-green-600 border-green-200",
  failed: "bg-orange-50 text-orange-600 border-orange-200",
  paid_not_applied: "bg-red-50 text-red-600 border-red-200",
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
};
