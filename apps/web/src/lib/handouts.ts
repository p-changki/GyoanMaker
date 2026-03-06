import { getDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// ── Types ──────────────────────────────────────────────

export interface HandoutMeta {
  id: string;
  ownerEmail: string;
  title: string;
  passageCount: number;
  level: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  inputHash?: string;
}

export interface HandoutDetail extends HandoutMeta {
  /** Raw text per section keyed by section ID (e.g. "P01") */
  sections: Record<string, string>;
  /** Custom text overrides from the compile editor */
  customTexts: {
    headerText?: string;
    analysisTitleText?: string;
    summaryTitleText?: string;
  };
}

// ── Constants ──────────────────────────────────────────

const MAX_HANDOUTS_PER_USER = 100;

// ── Helpers ────────────────────────────────────────────

/** Returns the handouts subcollection ref for a given user */
function handoutsCol(ownerEmail: string) {
  return getDb()
    .collection("users")
    .doc(ownerEmail.toLowerCase())
    .collection("handouts");
}

// ── Create ─────────────────────────────────────────────

export interface CreateHandoutInput {
  ownerEmail: string;
  title: string;
  sections: Record<string, string>;
  level: string;
  model: string;
  inputHash?: string;
  customTexts?: {
    headerText?: string;
    analysisTitleText?: string;
    summaryTitleText?: string;
  };
}

export async function createHandout(
  input: CreateHandoutInput
): Promise<HandoutMeta> {
  const now = new Date().toISOString();
  const passageCount = Object.keys(input.sections).length;
  const email = input.ownerEmail.toLowerCase();

  const docRef = handoutsCol(email).doc();

  const data = {
    ownerEmail: email,
    title: input.title,
    passageCount,
    level: input.level,
    model: input.model,
    sections: input.sections,
    customTexts: input.customTexts ?? {},
    inputHash: input.inputHash ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(data);

  return {
    id: docRef.id,
    ownerEmail: email,
    title: data.title,
    passageCount,
    level: data.level,
    model: data.model,
    createdAt: now,
    updatedAt: now,
    inputHash: data.inputHash ?? undefined,
  };
}

// ── List ───────────────────────────────────────────────

export async function listHandouts(
  ownerEmail: string,
  limit: number = MAX_HANDOUTS_PER_USER
): Promise<HandoutMeta[]> {
  const snapshot = await handoutsCol(ownerEmail)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      ownerEmail: d.ownerEmail,
      title: d.title,
      passageCount: d.passageCount ?? 0,
      level: d.level ?? "advanced",
      model: d.model ?? "pro",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      inputHash: typeof d.inputHash === "string" ? d.inputHash : undefined,
    };
  });
}

// ── Find by Input Hash ──────────────────────────────

export async function findHandoutsByInputHash(
  ownerEmail: string,
  inputHash: string
): Promise<HandoutMeta[]> {
  // Single-field query avoids composite index requirement
  const snapshot = await handoutsCol(ownerEmail)
    .where("inputHash", "==", inputHash)
    .limit(10)
    .get();

  const results = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      ownerEmail: d.ownerEmail,
      title: d.title,
      passageCount: d.passageCount ?? 0,
      level: d.level ?? "advanced",
      model: d.model ?? "pro",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      inputHash: typeof d.inputHash === "string" ? d.inputHash : undefined,
    };
  });

  // Sort client-side and take top 5
  return results
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);
}

// ── Get ────────────────────────────────────────────────

export async function getHandout(
  id: string,
  ownerEmail: string
): Promise<HandoutDetail | null> {
  const doc = await handoutsCol(ownerEmail).doc(id).get();

  if (!doc.exists) return null;

  const d = doc.data()!;

  return {
    id: doc.id,
    ownerEmail: d.ownerEmail,
    title: d.title,
    passageCount: d.passageCount ?? 0,
    level: d.level ?? "advanced",
    model: d.model ?? "pro",
    sections: d.sections ?? {},
    customTexts: d.customTexts ?? {},
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ── Update Title ───────────────────────────────────────

export async function updateHandoutTitle(
  id: string,
  ownerEmail: string,
  title: string
): Promise<boolean> {
  const docRef = handoutsCol(ownerEmail).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  await docRef.update({
    title,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}

// ── Delete ─────────────────────────────────────────────

export async function deleteHandout(
  id: string,
  ownerEmail: string
): Promise<boolean> {
  const docRef = handoutsCol(ownerEmail).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  await docRef.delete();
  return true;
}

// ── Delete All (for account deletion) ─────────────────

/** Deletes all handouts for a user. Firestore batch limit = 500. */
export async function deleteAllHandouts(ownerEmail: string): Promise<number> {
  const col = handoutsCol(ownerEmail);
  let totalDeleted = 0;

  // Paginate in batches of 500 (Firestore batch limit)
  while (true) {
    const snapshot = await col.limit(500).get();
    if (snapshot.empty) break;

    const batch = getDb().batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    totalDeleted += snapshot.size;
  }

  return totalDeleted;
}
