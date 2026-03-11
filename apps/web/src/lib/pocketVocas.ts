import { getDb } from "./firebase-admin";
import type { SavedPocketVoca, PocketVocaData, PocketVocaConfig } from "@gyoanmaker/shared/types";

const COLLECTION = "pocket-vocas";

export interface PocketVocaMeta {
  id: string;
  ownerEmail: string;
  title: string;
  passageCount: number;
  model: "flash" | "pro";
  handoutId: string;
  handoutTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePocketVocaInput {
  ownerEmail: string;
  title: string;
  passageCount: number;
  model: "flash" | "pro";
  data: PocketVocaData;
  config: PocketVocaConfig;
  handoutId: string;
  handoutTitle: string;
}

export async function listPocketVocas(email: string): Promise<PocketVocaMeta[]> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where("ownerEmail", "==", email)
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      ownerEmail: d.ownerEmail ?? email,
      title: d.title ?? "",
      passageCount: d.passageCount ?? 0,
      model: d.model ?? "pro",
      handoutId: d.handoutId ?? "",
      handoutTitle: d.handoutTitle ?? "",
      createdAt: d.createdAt ?? "",
      updatedAt: d.updatedAt ?? "",
    };
  });
}

export async function getPocketVoca(
  id: string,
  email: string
): Promise<SavedPocketVoca | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).doc(id).get();

  if (!doc.exists) return null;

  const d = doc.data()!;
  if (d.ownerEmail !== email) return null;

  return {
    id: doc.id,
    ownerEmail: d.ownerEmail,
    title: d.title ?? "",
    passageCount: d.passageCount ?? 0,
    model: d.model ?? "pro",
    data: d.data ?? { passages: [], model: d.model ?? "pro", generatedAt: "", handoutId: "", handoutTitle: "" },
    config: d.config ?? { sheetCode: "", sheetTitle: "", sectionLabel: "", rangeDescription: "", teacherName: "" },
    handoutId: d.handoutId ?? "",
    handoutTitle: d.handoutTitle ?? "",
    createdAt: d.createdAt ?? "",
    updatedAt: d.updatedAt ?? "",
  };
}

export async function createPocketVoca(input: CreatePocketVocaInput): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();

  const docRef = await db.collection(COLLECTION).add({
    ownerEmail: input.ownerEmail,
    title: input.title,
    passageCount: input.passageCount,
    model: input.model,
    data: input.data,
    config: input.config,
    handoutId: input.handoutId,
    handoutTitle: input.handoutTitle,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function deletePocketVoca(id: string, email: string): Promise<boolean> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).doc(id).get();

  if (!doc.exists) return false;
  if (doc.data()?.ownerEmail !== email) return false;

  await db.collection(COLLECTION).doc(id).delete();
  return true;
}
