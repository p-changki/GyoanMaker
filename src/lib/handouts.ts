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

const COLLECTION = "handouts";
const MAX_HANDOUTS_PER_USER = 100;

// ── Create ─────────────────────────────────────────────

export interface CreateHandoutInput {
  ownerEmail: string;
  title: string;
  sections: Record<string, string>;
  level: string;
  model: string;
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

  const docRef = getDb().collection(COLLECTION).doc();

  const data = {
    ownerEmail: input.ownerEmail.toLowerCase(),
    title: input.title,
    passageCount,
    level: input.level,
    model: input.model,
    sections: input.sections,
    customTexts: input.customTexts ?? {},
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(data);

  return {
    id: docRef.id,
    ownerEmail: data.ownerEmail,
    title: data.title,
    passageCount,
    level: data.level,
    model: data.model,
    createdAt: now,
    updatedAt: now,
  };
}

// ── List ───────────────────────────────────────────────

export async function listHandouts(
  ownerEmail: string,
  limit: number = MAX_HANDOUTS_PER_USER
): Promise<HandoutMeta[]> {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("ownerEmail", "==", ownerEmail.toLowerCase())
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
    };
  });
}

// ── Get ────────────────────────────────────────────────

export async function getHandout(
  id: string,
  ownerEmail: string
): Promise<HandoutDetail | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();

  if (!doc.exists) return null;

  const d = doc.data()!;

  // Ownership check
  if (d.ownerEmail !== ownerEmail.toLowerCase()) return null;

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
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return false;

  const d = doc.data()!;
  if (d.ownerEmail !== ownerEmail.toLowerCase()) return false;

  await getDb().collection(COLLECTION).doc(id).update({
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
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return false;

  const d = doc.data()!;
  if (d.ownerEmail !== ownerEmail.toLowerCase()) return false;

  await getDb().collection(COLLECTION).doc(id).delete();
  return true;
}
