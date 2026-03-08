import type { IllustrationStylePreset } from "@gyoanmaker/shared/types";
import { getDb } from "./firebase-admin";

const PRESETS_COLLECTION = "illustrationStylePresets";
const MAX_PRESETS = 10;

function presetsCol(email: string) {
  return getDb()
    .collection("users")
    .doc(email.toLowerCase())
    .collection(PRESETS_COLLECTION);
}

function toPreset(
  doc: FirebaseFirestore.DocumentSnapshot
): IllustrationStylePreset {
  const data = doc.data() as Omit<IllustrationStylePreset, "presetId">;
  return { ...data, presetId: doc.id };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listStylePresets(
  email: string
): Promise<IllustrationStylePreset[]> {
  const snap = await presetsCol(email)
    .orderBy("createdAt", "desc")
    .limit(MAX_PRESETS)
    .get();

  return snap.docs.map(toPreset);
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export async function saveStylePreset(
  email: string,
  input: Omit<IllustrationStylePreset, "presetId" | "createdAt">
): Promise<IllustrationStylePreset> {
  const col = presetsCol(email);

  const existing = await col.orderBy("createdAt", "asc").get();
  if (existing.size >= MAX_PRESETS) {
    // Auto-delete oldest
    const oldest = existing.docs[0]!;
    await oldest.ref.delete();
  }

  const docRef = col.doc();
  const preset: Omit<IllustrationStylePreset, "presetId"> = {
    ...input,
    createdAt: new Date().toISOString(),
  };
  await docRef.set(preset);

  return { ...preset, presetId: docRef.id };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteStylePreset(
  email: string,
  presetId: string
): Promise<void> {
  await presetsCol(email).doc(presetId).delete();
}
