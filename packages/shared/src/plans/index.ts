export type PlanId = "free" | "basic" | "standard" | "pro";
export type PlanStatus = "active" | "past_due" | "canceled";
export type PaymentMethod = "mock" | "toss";
export type QuotaModel = "flash" | "pro";
export type TopUpCreditType = QuotaModel | "illustration";
export type TopUpPackageId =
  | "flash_50"
  | "flash_100"
  | "pro_20"
  | "pro_50"
  | "illu_30"
  | "illu_60"
  | "illu_120";
export type OrderType = "subscription" | "topup";
export type OrderStatus = "pending" | "confirmed" | "failed" | "paid_not_applied";

export interface PendingOrder {
  orderId: string;
  email: string;
  type: OrderType;
  planId?: PlanId;
  packageId?: TopUpPackageId;
  amount: number;
  orderName: string;
  status: OrderStatus;
  createdAt: string;
  confirmedAt?: string;
  paymentKey?: string;
}

export interface PlanDefinition {
  flashLimit: number;
  proLimit: number;
  illustrationMonthlyLimit: number;
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

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    flashLimit: 10,
    proLimit: 5,
    illustrationMonthlyLimit: 5,
    price: 0,
    storageLimit: 3,
  },
  basic: {
    flashLimit: 250,
    proLimit: 30,
    illustrationMonthlyLimit: 10,
    price: 14_900,
    storageLimit: null,
  },
  standard: {
    flashLimit: 500,
    proLimit: 120,
    illustrationMonthlyLimit: 30,
    price: 34_900,
    storageLimit: null,
  },
  pro: {
    flashLimit: 1_000,
    proLimit: 400,
    illustrationMonthlyLimit: 60,
    price: 79_000,
    storageLimit: null,
  },
};

export const MODEL_DISPLAY_NAMES: Record<TopUpCreditType, string> = {
  flash: "Speed",
  pro: "Precision",
  illustration: "Illustration",
};

export const TOP_UP_PACKAGES: TopUpPackageDefinition[] = [
  { id: "flash_50", type: "flash", label: "Speed 50", amount: 50, price: 3_000 },
  { id: "flash_100", type: "flash", label: "Speed 100", amount: 100, price: 5_500 },
  { id: "pro_20", type: "pro", label: "Precision 20", amount: 20, price: 5_500 },
  { id: "pro_50", type: "pro", label: "Precision 50", amount: 50, price: 12_000 },
  { id: "illu_30", type: "illustration", label: "Illustration 30", amount: 30, price: 6_900 },
  { id: "illu_60", type: "illustration", label: "Illustration 60", amount: 60, price: 12_900 },
  { id: "illu_120", type: "illustration", label: "Illustration 120", amount: 120, price: 23_900 },
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
