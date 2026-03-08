import type { IllustrationSample } from "@gyoanmaker/shared/types";
import { getDb } from "./firebase-admin";

const PRESETS_COLLECTION = "illustrationPresets";

function presetsCol() {
  return getDb().collection(PRESETS_COLLECTION);
}

function toPreset(
  doc: FirebaseFirestore.DocumentSnapshot
): IllustrationSample {
  const data = doc.data() as Omit<IllustrationSample, "sampleId">;
  return { ...data, sampleId: doc.id, isPreset: true, isActive: false };
}

// ---------------------------------------------------------------------------
// List (all users can read)
// ---------------------------------------------------------------------------

export async function listIllustrationPresets(): Promise<IllustrationSample[]> {
  const snap = await presetsCol()
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  return snap.docs.map(toPreset);
}

// ---------------------------------------------------------------------------
// Add (admin only)
// ---------------------------------------------------------------------------

export async function addIllustrationPreset(
  sample: Omit<IllustrationSample, "sampleId" | "isActive" | "isPreset">
): Promise<IllustrationSample> {
  const docRef = presetsCol().doc();
  const data: Omit<IllustrationSample, "sampleId"> = {
    ...sample,
    isActive: false,
    isPreset: true,
  };
  await docRef.set(data);
  return { ...data, sampleId: docRef.id };
}

// ---------------------------------------------------------------------------
// Remove (admin only)
// ---------------------------------------------------------------------------

export async function removeIllustrationPreset(
  presetId: string
): Promise<void> {
  await presetsCol().doc(presetId).delete();
}

// ---------------------------------------------------------------------------
// Get single preset (for activation)
// ---------------------------------------------------------------------------

export async function getIllustrationPreset(
  presetId: string
): Promise<IllustrationSample | null> {
  const doc = await presetsCol().doc(presetId).get();
  if (!doc.exists) return null;
  return toPreset(doc);
}
