import type { IllustrationSample, IllustrationReferenceImage } from "@gyoanmaker/shared/types";
import { getDb } from "./firebase-admin";
import { deleteIllustrationImage } from "./firebase-storage";

const SAMPLES_COLLECTION = "illustrationSamples";
const MAX_SAMPLES = 30;

function userDocRef(email: string) {
  return getDb().collection("users").doc(email.toLowerCase());
}

function samplesCol(email: string) {
  return userDocRef(email).collection(SAMPLES_COLLECTION);
}

function toSample(
  doc: FirebaseFirestore.DocumentSnapshot
): IllustrationSample {
  const data = doc.data() as Omit<IllustrationSample, "sampleId">;
  return { ...data, sampleId: doc.id };
}

function sampleToReferenceImage(
  sample: IllustrationSample
): IllustrationReferenceImage {
  return {
    imageUrl: sample.imageUrl,
    storagePath: sample.storagePath,
    mimeType: "image/png",
    source: "sample",
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listIllustrationSamples(
  email: string
): Promise<IllustrationSample[]> {
  const snap = await samplesCol(email)
    .orderBy("createdAt", "desc")
    .limit(MAX_SAMPLES)
    .get();

  return snap.docs.map(toSample);
}

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

export async function saveIllustrationSample(
  email: string,
  input: Omit<IllustrationSample, "sampleId" | "createdAt" | "isActive">
): Promise<IllustrationSample> {
  const col = samplesCol(email);

  // Check count and auto-prune oldest inactive if over limit
  const existing = await col.orderBy("createdAt", "asc").get();
  if (existing.size >= MAX_SAMPLES) {
    const inactiveDocs = existing.docs.filter(
      (d) => !(d.data() as IllustrationSample).isActive
    );
    if (inactiveDocs.length === 0) {
      throw new Error("Sample limit reached. Delete some samples first.");
    }
    const oldest = inactiveDocs[0]!;
    const oldestData = oldest.data() as IllustrationSample;
    if (oldestData.storagePath) {
      await deleteIllustrationImage(oldestData.storagePath);
    }
    await oldest.ref.delete();
  }

  const docRef = col.doc();
  const sample: Omit<IllustrationSample, "sampleId"> = {
    ...input,
    isActive: false,
    createdAt: new Date().toISOString(),
  };
  await docRef.set(sample);

  return { ...sample, sampleId: docRef.id };
}

// ---------------------------------------------------------------------------
// Activate / Deactivate
// ---------------------------------------------------------------------------

export async function activateIllustrationSample(
  email: string,
  sampleId: string
): Promise<void> {
  const col = samplesCol(email);
  const db = getDb();

  await db.runTransaction(async (tx) => {
    // Read the sample to activate
    const sampleDoc = await tx.get(col.doc(sampleId));
    if (!sampleDoc.exists) {
      throw new Error("Sample not found.");
    }
    const sampleData = sampleDoc.data() as Omit<IllustrationSample, "sampleId">;

    // Deactivate all currently active samples
    const activeSnap = await tx.get(
      col.where("isActive", "==", true)
    );
    for (const doc of activeSnap.docs) {
      tx.update(doc.ref, { isActive: false });
    }

    // Activate the selected sample
    tx.update(col.doc(sampleId), { isActive: true });

    // Sync profile referenceImage so generation uses this sample's image
    const refImage = sampleToReferenceImage({
      ...sampleData,
      sampleId,
    });
    tx.set(
      userDocRef(email),
      { illustrationProfile: { referenceImage: refImage } },
      { merge: true }
    );
  });
}

export async function deactivateIllustrationSample(
  email: string,
  sampleId: string
): Promise<void> {
  const db = getDb();
  const col = samplesCol(email);
  const { FieldValue } = await import("firebase-admin/firestore");

  await db.runTransaction(async (tx) => {
    tx.update(col.doc(sampleId), { isActive: false });

    // Clear profile referenceImage when no sample is active
    tx.set(
      userDocRef(email),
      { illustrationProfile: { referenceImage: FieldValue.delete() } },
      { merge: true }
    );
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteIllustrationSample(
  email: string,
  sampleId: string
): Promise<void> {
  const col = samplesCol(email);
  const doc = await col.doc(sampleId).get();

  if (!doc.exists) return;

  const data = doc.data() as IllustrationSample;

  // If deleting the active sample, also clear profile referenceImage
  if (data.isActive) {
    const { FieldValue } = await import("firebase-admin/firestore");
    await userDocRef(email).set(
      { illustrationProfile: { referenceImage: FieldValue.delete() } },
      { merge: true }
    );
  }

  if (data.storagePath) {
    await deleteIllustrationImage(data.storagePath);
  }

  await col.doc(sampleId).delete();
}
