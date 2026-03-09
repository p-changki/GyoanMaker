export type PlanId = "free" | "basic" | "standard" | "pro";
export type PlanStatus = "active" | "past_due" | "canceled";
export type PaymentMethod = "mock" | "toss";
export type QuotaModel = "flash" | "pro";
export type TopUpCreditType = QuotaModel | "illustration";
export type TopUpPackageId =
  | "illu_20"
  | "illu_50"
  | "illu_100"
  | "pro_20"
  | "pro_60"
  | "flash_100";
export type OrderType = "subscription" | "topup";
export type OrderStatus = "pending" | "confirmed" | "failed" | "paid_not_applied";
export type RefundStatus = "none" | "requested" | "processed" | "rejected";

export interface PendingOrder {
  orderId: string;
  email: string;
  type: OrderType;
  planId?: PlanId;
  packageId?: TopUpPackageId;
  /**
   * 공급가(부가세 제외)
   */
  supplyAmount?: number;
  /**
   * 부가세 금액
   */
  vatAmount?: number;
  amount: number;
  orderName: string;
  status: OrderStatus;
  createdAt: string;
  confirmedAt?: string;
  paymentKey?: string;
  /**
   * Refund metadata (manual ops first, API automation later)
   * - none: default state (no refund workflow started)
   * - requested: user requested refund
   * - processed: refund completed
   * - rejected: refund request rejected
   */
  refundStatus?: RefundStatus;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundAmount?: number;
}

export interface PlanDefinition {
  flashLimit: number;
  proLimit: number;
  illustrationMonthlyLimit: number;
  maxSamples: number;
  dailySampleLimit: number;
  price: number;
  storageLimit: number | null;
}

export interface TopUpPackageDefinition {
  id: TopUpPackageId;
  type: TopUpCreditType;
  label: string;
  amount: number;
  price: number;
}

export interface VatAmountBreakdown {
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export const VAT_RATE = 0.1;

/**
 * VAT 별도 정책 기준 결제 금액(공급가 + 부가세) 계산
 */
export function toVatInclusiveAmount(
  supplyAmount: number
): VatAmountBreakdown {
  const normalizedSupply =
    Number.isFinite(supplyAmount) && supplyAmount > 0
      ? Math.floor(supplyAmount)
      : 0;
  const vatAmount = Math.round(normalizedSupply * VAT_RATE);
  return {
    supplyAmount: normalizedSupply,
    vatAmount,
    totalAmount: normalizedSupply + vatAmount,
  };
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    flashLimit: 10,
    proLimit: 5,
    illustrationMonthlyLimit: 5,
    maxSamples: 10,
    dailySampleLimit: 3,
    price: 0,
    storageLimit: 3,
  },
  basic: {
    flashLimit: 300,
    proLimit: 100,
    illustrationMonthlyLimit: 20,
    maxSamples: 20,
    dailySampleLimit: 5,
    price: 24_900,
    storageLimit: null,
  },
  standard: {
    flashLimit: 800,
    proLimit: 200,
    illustrationMonthlyLimit: 50,
    maxSamples: 30,
    dailySampleLimit: 10,
    price: 49_900,
    storageLimit: null,
  },
  pro: {
    flashLimit: 2_000,
    proLimit: 400,
    illustrationMonthlyLimit: 100,
    maxSamples: 30,
    dailySampleLimit: 10,
    price: 99_000,
    storageLimit: null,
  },
};

export const MODEL_DISPLAY_NAMES: Record<TopUpCreditType, string> = {
  flash: "Speed",
  pro: "Precision",
  illustration: "Illustration",
};

export const TOP_UP_PACKAGES: TopUpPackageDefinition[] = [
  { id: "illu_20", type: "illustration", label: "일러스트 20장", amount: 20, price: 3_900 },
  { id: "illu_50", type: "illustration", label: "일러스트 50장", amount: 50, price: 8_900 },
  { id: "illu_100", type: "illustration", label: "일러스트 100장", amount: 100, price: 15_900 },
  { id: "pro_20", type: "pro", label: "교재 1권 팩", amount: 20, price: 5_900 },
  { id: "pro_60", type: "pro", label: "교재 3권 팩", amount: 60, price: 15_900 },
  { id: "flash_100", type: "flash", label: "속도 팩", amount: 100, price: 2_900 },
];

const KST_TIME_ZONE = "Asia/Seoul";
const CREDIT_VALID_DAYS = 90;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getDatePart(
  date: Date,
  type: "year" | "month",
  timeZone: string
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) {
    throw new Error(`Failed to resolve date part: ${type}`);
  }
  return value;
}

export function getMonthKeyKst(date: Date = new Date()): string {
  const year = getDatePart(date, "year", KST_TIME_ZONE);
  const month = getDatePart(date, "month", KST_TIME_ZONE);
  return `${year}-${month}`;
}

export function getNowIso(date: Date = new Date()): string {
  return date.toISOString();
}

export function getCreditExpiryIso(
  purchasedAt: Date = new Date(),
  validDays: number = CREDIT_VALID_DAYS
): string {
  const expiresAt = new Date(purchasedAt.getTime() + validDays * ONE_DAY_MS);
  return expiresAt.toISOString();
}
