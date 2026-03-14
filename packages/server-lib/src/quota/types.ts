import type { PlanId, QuotaModel } from "@gyoanmaker/shared/plans";
import type { CreditEntry, UserCredits, UserPlan, UserQuota } from "@gyoanmaker/shared/types";

export const COLLECTION = "users";
export const DEFAULT_PLAN: PlanId = "free";
const LEGACY_DEFAULT_DAILY_LIMIT = 50;
const LEGACY_DEFAULT_MONTHLY_LIMIT = 500;

export interface LegacyQuotaLimits {
  dailyLimit: number;
  monthlyLimit: number;
}

export const DEFAULT_QUOTA: LegacyQuotaLimits = {
  dailyLimit: LEGACY_DEFAULT_DAILY_LIMIT,
  monthlyLimit: LEGACY_DEFAULT_MONTHLY_LIMIT,
};

export interface QuotaModelStatus {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
}

export interface QuotaStatus {
  plan: PlanId;
  monthKeyKst: string;
  flash: QuotaModelStatus & { creditEntries: CreditEntry[] };
  pro: QuotaModelStatus & { creditEntries: CreditEntry[] };
  storage: {
    limit: number | null;
    used: number;
    remaining: number | null;
  };
  illustration: QuotaModelStatus & { creditEntries: CreditEntry[] };
  canGenerate: boolean;
  canGenerateByModel: Record<QuotaModel, boolean>;
}

export interface QuotaLimitsUpdate {
  flashMonthlyLimit?: number;
  proMonthlyLimit?: number;
  storageLimit?: number | null;
  illustrationMonthlyLimit?: number;
}

export interface UserDocLike {
  plan?: {
    tier?: PlanId;
    status?: string;
    currentPeriodStartAt?: string;
    currentPeriodEndAt?: string | null;
  };
  quota?: {
    dailyLimit?: number;
    monthlyLimit?: number;
    storageLimit?: number | null;
    storageUsed?: number;
    flash?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
    pro?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
    illustration?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
  };
  usage?: {
    daily?: { count?: number; key?: string };
    monthly?: { count?: number; key?: string };
  };
  credits?: {
    flash?: CreditEntry[];
    pro?: CreditEntry[];
    illustration?: CreditEntry[];
  };
}

export interface NormalizedUserState {
  plan: UserPlan;
  quota: UserQuota;
  credits: UserCredits;
  legacyUsageDaily: { count: number; key: string };
  legacyUsageMonthly: { count: number; key: string };
  needsPersist: boolean;
}

/**
 * Receipt returned by reserveQuota — captures exactly what was consumed
 * so rollbackQuota can reverse the operation precisely.
 */
export interface ReservationReceipt {
  readonly email: string;
  readonly model: QuotaModel;
  readonly fromSubscription: number;
  readonly fromCredits: number;
  /** Snapshot of credit entries before consumption (for precise rollback). */
  readonly creditSnapshotBeforeConsume: CreditEntry[];
}

export class QuotaExceededError extends Error {
  readonly code = "QUOTA_EXCEEDED";
  readonly model: QuotaModel;
  readonly needed: number;
  readonly available: number;

  constructor(model: QuotaModel, needed: number, available: number) {
    super(`${model.toUpperCase()} quota exceeded: need ${needed}, have ${available}`);
    this.name = "QuotaExceededError";
    this.model = model;
    this.needed = needed;
    this.available = available;
  }
}
