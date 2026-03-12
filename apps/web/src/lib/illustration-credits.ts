import { type Transaction } from "firebase-admin/firestore";
import { getCreditExpiryIso } from "@gyoanmaker/shared/plans";
import type { CreditEntry, IllustrationQuality } from "@gyoanmaker/shared/types";
import { getDb } from "./firebase-admin";
import { consumeCredits, normalizeUserState, buildPersistPayload } from "./quota/resolvers";
import type { UserDocLike } from "./quota/types";

const USER_COLLECTION = "users";

export const ILLUSTRATION_CREDIT_COST: Record<IllustrationQuality, number> = {
  draft: 1,
  standard: 1,
  hq: 2,
};

export class IllustrationCreditError extends Error {
  readonly code = "ILLUSTRATION_CREDIT_INSUFFICIENT";
  readonly needed: number;
  readonly available: number;

  constructor(needed: number, available: number) {
    super(`Illustration credits are insufficient. need=${needed} available=${available}`);
    this.name = "IllustrationCreditError";
    this.needed = needed;
    this.available = available;
  }
}

export type CreditError = IllustrationCreditError;

function userDocRef(email: string) {
  return getDb().collection(USER_COLLECTION).doc(email.toLowerCase());
}

export async function getIllustrationCredits(email: string): Promise<number> {
  const snap = await userDocRef(email).get();
  const data = (snap.data() ?? {}) as UserDocLike;
  const state = normalizeUserState(data, new Date());
  const illuQuota = state.quota.illustration;
  const monthlyRemaining = Math.max(0, illuQuota.monthlyLimit - illuQuota.used);
  const purchasedCredits = state.credits.illustration.reduce(
    (sum, entry) => sum + Math.max(0, entry.remaining),
    0
  );
  return monthlyRemaining + purchasedCredits;
}

export async function reserveIllustrationCredits(
  tx: Transaction,
  email: string,
  amount: number
): Promise<void> {
  const userRef = userDocRef(email);
  const snap = await tx.get(userRef);
  const data = (snap.data() ?? {}) as UserDocLike;
  const state = normalizeUserState(data, new Date());

  // First consume from monthly quota
  const illuQuota = state.quota.illustration;
  const subRemaining = Math.max(0, illuQuota.monthlyLimit - illuQuota.used);
  const fromSub = Math.min(subRemaining, amount);
  const updatedQuota = {
    ...state.quota,
    illustration: {
      ...illuQuota,
      used: illuQuota.used + fromSub,
    },
  };

  // Then fall back to purchased credits
  const needCredits = amount - fromSub;
  let updatedCredits = state.credits;

  if (needCredits > 0) {
    const consumed = consumeCredits(state.credits.illustration, needCredits);
    if (consumed.consumed < needCredits) {
      throw new IllustrationCreditError(amount, fromSub + consumed.consumed);
    }
    updatedCredits = { ...state.credits, illustration: consumed.updated };
  }

  const updatedState = { ...state, quota: updatedQuota, credits: updatedCredits };
  tx.set(userRef, buildPersistPayload(updatedState), { merge: true });
}

export async function refundIllustrationCredits(
  tx: Transaction,
  email: string,
  amount: number,
  reason: string
): Promise<void> {
  if (amount <= 0) return;

  const userRef = userDocRef(email);
  const snap = await tx.get(userRef);
  const data = (snap.data() ?? {}) as UserDocLike;
  const state = normalizeUserState(data, new Date());

  // Refund to monthly quota first (up to the used amount)
  const illuQuota = state.quota.illustration;
  const refundToMonthly = Math.min(amount, illuQuota.used);
  const remaining = amount - refundToMonthly;

  const updatedQuota = {
    ...state.quota,
    illustration: {
      ...illuQuota,
      used: illuQuota.used - refundToMonthly,
    },
  };

  // Remaining refund goes to purchased credits
  let updatedCredits = state.credits;
  if (remaining > 0) {
    const now = new Date();
    const entry: CreditEntry = {
      remaining,
      total: remaining,
      purchasedAt: now.toISOString(),
      expiresAt: getCreditExpiryIso(now),
      orderId: reason,
    };
    updatedCredits = {
      ...state.credits,
      illustration: [...state.credits.illustration, entry],
    };
  }

  const updatedState = { ...state, quota: updatedQuota, credits: updatedCredits };
  tx.set(userRef, buildPersistPayload(updatedState), { merge: true });
}
