import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";

const COLLECTION = "users";
const SUBCOLLECTION = "plan_history";

export interface PlanHistoryEntry {
  fromTier: string;
  toTier: string;
  fromStatus: string;
  toStatus: string;
  changedBy: "system" | "admin" | "user";
  reason: string;
  changedAt: string;
}

export interface PlanHistoryRow extends PlanHistoryEntry {
  id: string;
}

/**
 * Log a plan change to the user's plan_history subcollection.
 * Fire-and-forget safe — errors are logged but not thrown.
 */
export async function logPlanChange(
  email: string,
  entry: PlanHistoryEntry,
): Promise<void> {
  const key = email.toLowerCase();
  try {
    await getDb()
      .collection(COLLECTION)
      .doc(key)
      .collection(SUBCOLLECTION)
      .add({
        ...entry,
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch (err) {
    console.error(
      `[plan-history] Failed to log plan change for ${key}:`,
      err,
    );
  }
}

/**
 * Fetch plan change history for a user, ordered by most recent first.
 */
export async function getPlanHistory(
  email: string,
  limit = 50,
): Promise<PlanHistoryRow[]> {
  const key = email.toLowerCase();
  const snap = await getDb()
    .collection(COLLECTION)
    .doc(key)
    .collection(SUBCOLLECTION)
    .orderBy("changedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as PlanHistoryEntry;
    return { id: doc.id, ...data };
  });
}
