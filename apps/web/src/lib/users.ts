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
 * 관리자 이메일 여부 확인
 * ADMIN_EMAILS 환경변수(쉼표 구분)와 비교한다.
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

/**
 * 사용자 조회 (이메일 기준)
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
 * 사용자 상태 조회
 */
export async function getUserStatus(email: string): Promise<UserStatus | null> {
  const user = await getUser(email);
  return user?.status ?? null;
}

/**
 * 최초 로그인 시 자동 등록 (이미 존재하면 스킵)
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
    status: "pending",
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
      } satisfies UserCredits,
    });
  console.log(`[users] new pending user: ${key}`);
  return newUser;
}

/**
 * 사용자 상태 변경
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
  console.log(`[users] ${key} -> ${status}`);
}

/**
 * 사용자 목록 조회 (필터 선택)
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
 * 사용자 삭제
 */
export async function deleteUser(email: string): Promise<void> {
  const key = email.toLowerCase();
  await getDb().collection(COLLECTION).doc(key).delete();
  console.log(`[users] deleted: ${key}`);
}
