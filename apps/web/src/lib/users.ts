import { getDb } from "./firebase-admin";
import { DEFAULT_QUOTA } from "./quota";
import {
  getMonthKeyKst,
  getNowIso,
  PLANS,
} from "@gyoanmaker/shared/plans";
import type {
  UserCredits,
  UserPlan,
  UserQuota,
} from "@gyoanmaker/shared/types";

export type UserStatus = "pending" | "approved" | "rejected";

/**
 * Check if email is admin
 * Compares against ADMIN_EMAILS env var (comma-separated).
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    console.warn("[users] ADMIN_EMAILS not configured. Admin access denied.");
  }
  return adminEmails.includes(email.toLowerCase());
}

export interface AppUser {
  email: string;
  name: string | null;
  image: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  plan?: UserPlan;
  quota?:
    | (UserQuota & {
        dailyLimit?: number;
        monthlyLimit?: number;
      })
    | {
        dailyLimit?: number;
        monthlyLimit?: number;
      };
  credits?: UserCredits;
}

const COLLECTION = "users";

function maskEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const [local, domain] = lower.split("@");
  if (!local || !domain) return "***";
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

/**
 * Get user by email
 */
export async function getUser(email: string): Promise<AppUser | null> {
  const doc = await getDb()
    .collection(COLLECTION)
    .doc(email.toLowerCase())
    .get();
  if (!doc.exists) return null;
  return doc.data() as AppUser;
}

/**
 * Get user status
 */
export async function getUserStatus(email: string): Promise<UserStatus | null> {
  const user = await getUser(email);
  return user?.status ?? null;
}

/**
 * Auto-register on first login (skip if exists)
 */
export async function findOrCreateUser(
  email: string,
  name: string | null,
  image: string | null
): Promise<AppUser> {
  const key = email.toLowerCase();
  const existing = await getUser(key);
  if (existing) return existing;

  const now = getNowIso();
  const today = new Date().toISOString().slice(0, 10);
  const legacyMonth = new Date().toISOString().slice(0, 7);
  const monthKeyKst = getMonthKeyKst();
  const freePlan = PLANS.free;

  const newUser: AppUser = {
    email: key,
    name,
    image,
    status: "approved",
    createdAt: now,
    updatedAt: now,
  };

  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set({
      ...newUser,
      plan: {
        tier: "free",
        status: "active",
        currentPeriodStartAt: now,
        currentPeriodEndAt: null,
        paymentMethod: null,
      } satisfies UserPlan,
      quota: {
        ...DEFAULT_QUOTA,
        flash: {
          monthlyLimit: freePlan.flashLimit,
          used: 0,
          monthKeyKst,
        },
        pro: {
          monthlyLimit: freePlan.proLimit,
          used: 0,
          monthKeyKst,
        },
        illustration: {
          monthlyLimit: freePlan.illustrationMonthlyLimit,
          used: 0,
          monthKeyKst,
        },
        storageLimit: freePlan.storageLimit,
        storageUsed: 0,
      },
      usage: {
        daily: { count: 0, key: today },
        monthly: { count: 0, key: legacyMonth },
      },
      credits: {
        flash: [],
        pro: [],
        illustration: [],
      } satisfies UserCredits,
    });
  console.log(`[users] new pending user: ${maskEmail(key)}`);
  return newUser;
}

/**
 * Update user status
 */
export async function updateUserStatus(
  email: string,
  status: UserStatus
): Promise<void> {
  const key = email.toLowerCase();
  await getDb().collection(COLLECTION).doc(key).update({
    status,
    updatedAt: new Date().toISOString(),
  });
  console.log(`[users] ${maskEmail(key)} -> ${status}`);
}

/**
 * Get user list (optional filter)
 */
export async function listUsers(filterStatus?: UserStatus): Promise<AppUser[]> {
  let query: FirebaseFirestore.Query = getDb().collection(COLLECTION);

  if (filterStatus) {
    query = query.where("status", "==", filterStatus);
  }

  const snapshot = await query.orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => doc.data() as AppUser);
}

/**
 * Delete user
 */
export async function deleteUser(email: string): Promise<void> {
  const key = email.toLowerCase();
  await getDb().collection(COLLECTION).doc(key).delete();
  console.log(`[users] deleted: ${maskEmail(key)}`);
}
