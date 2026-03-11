import crypto from "crypto";
import { getDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type {
  HandoutIllustration,
  HandoutIllustrations,
  WorkbookData,
} from "@gyoanmaker/shared/types";
import { deleteIllustrationFolder } from "./firebase-storage";

// ── Firestore Serialization ─────────────────────────────
// Firestore does not support nested arrays (e.g. string[][]).
// WorkbookStep3Item.options is string[][] — we serialize to string[]
// using a separator before writing, and deserialize on read.

const OPTIONS_SEPARATOR = "|||";

/** Convert WorkbookData for Firestore (flatten string[][] → string[]) */
function serializeWorkbookForFirestore(
  workbook: WorkbookData
): Record<string, unknown> {
  const serialized = JSON.parse(JSON.stringify(workbook));
  for (const passage of serialized.passages ?? []) {
    for (const item of passage.step3Items ?? []) {
      if (Array.isArray(item.options)) {
        item.options = item.options.map((opt: string[]) =>
          Array.isArray(opt) ? opt.join(OPTIONS_SEPARATOR) : opt
        );
      }
    }
  }
  return serialized;
}

/** Restore WorkbookData from Firestore (unflatten string[] → string[][]) */
function deserializeWorkbookFromFirestore(
  raw: Record<string, unknown>
): WorkbookData {
  const data = raw as unknown as WorkbookData;
  for (const passage of data.passages ?? []) {
    for (const item of passage.step3Items ?? []) {
      if (Array.isArray(item.options)) {
        item.options = (item.options as unknown as (string | string[])[]).map(
          (opt) =>
            typeof opt === "string" ? opt.split(OPTIONS_SEPARATOR) : opt
        );
      }
    }
  }
  return data;
}

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
  /** AI illustration map keyed by passage ID (e.g. "P01") */
  illustrations?: HandoutIllustrations;
  /** Custom text overrides from the compile editor */
  customTexts: {
    headerText?: string;
    analysisTitleText?: string;
    summaryTitleText?: string;
  };
  workbook?: WorkbookData | null;
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

function hashSectionRawText(rawText: string): string {
  return crypto.createHash("sha256").update(rawText, "utf8").digest("hex");
}

function markStaleIllustrations(
  sections: Record<string, string>,
  illustrations: HandoutIllustrations | undefined
): HandoutIllustrations | undefined {
  if (!illustrations || typeof illustrations !== "object") return undefined;

  const next: HandoutIllustrations = {};
  for (const [passageId, rawIllustration] of Object.entries(illustrations)) {
    const illustration = rawIllustration as HandoutIllustration;
    const rawText = sections[passageId] ?? "";
    const nextSourceHash = hashSectionRawText(rawText);

    // Preserve completed illustrations with imageUrl on load —
    // only mark stale if illustration is NOT completed with a valid image
    const hasCompletedImage =
      illustration?.status === "completed" && typeof illustration?.imageUrl === "string";

    const shouldMarkStale =
      !hasCompletedImage &&
      typeof illustration?.sourceHash === "string" &&
      illustration.sourceHash !== nextSourceHash &&
      illustration.status !== "queued" &&
      illustration.status !== "running";

    next[passageId] = shouldMarkStale
      ? {
          ...illustration,
          status: "stale",
        }
      : illustration;
  }

  return next;
}

// ── Create ─────────────────────────────────────────────

export interface CreateHandoutInput {
  ownerEmail: string;
  title: string;
  sections: Record<string, string>;
  level: string;
  model: string;
  inputHash?: string;
  illustrations?: HandoutIllustrations;
  customTexts?: {
    headerText?: string;
    analysisTitleText?: string;
    summaryTitleText?: string;
  };
  workbook?: WorkbookData | null;
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
    illustrations: input.illustrations ?? {},
    customTexts: input.customTexts ?? {},
    workbook: input.workbook
      ? serializeWorkbookForFirestore(input.workbook)
      : null,
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
  const sections = d.sections ?? {};
  const illustrations =
    d.illustrations && typeof d.illustrations === "object"
      ? markStaleIllustrations(
          sections,
          d.illustrations as HandoutIllustrations
        )
      : undefined;

  return {
    id: doc.id,
    ownerEmail: d.ownerEmail,
    title: d.title,
    passageCount: d.passageCount ?? 0,
    level: d.level ?? "advanced",
    model: d.model ?? "pro",
    sections,
    illustrations,
    customTexts: d.customTexts ?? {},
    workbook: d.workbook
      ? deserializeWorkbookFromFirestore(d.workbook as Record<string, unknown>)
      : null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ── Update (full save) ────────────────────────────────

export interface UpdateHandoutInput {
  title?: string;
  sections?: Record<string, string>;
  illustrations?: HandoutIllustrations;
  customTexts?: {
    headerText?: string;
    analysisTitleText?: string;
    summaryTitleText?: string;
  };
  workbook?: WorkbookData | null;
}

export async function updateHandout(
  id: string,
  ownerEmail: string,
  input: UpdateHandoutInput
): Promise<boolean> {
  const email = ownerEmail.toLowerCase();
  const docRef = handoutsCol(email).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.title !== undefined) {
    updates.title = input.title;
  }
  if (input.sections !== undefined) {
    updates.sections = input.sections;
    updates.passageCount = Object.keys(input.sections).length;
  }
  if (input.illustrations !== undefined) {
    updates.illustrations = input.illustrations;
  }
  if (input.customTexts !== undefined) {
    updates.customTexts = input.customTexts;
  }
  if (input.workbook !== undefined) {
    // Firestore rejects nested arrays (string[][]) and undefined values.
    // serializeWorkbookForFirestore flattens string[][] and strips undefined.
    updates.workbook = input.workbook
      ? serializeWorkbookForFirestore(input.workbook)
      : null;
  }

  await docRef.update(updates);
  return true;
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

// ── Update Illustrations ─────────────────────────────

export async function updateHandoutIllustrations(
  id: string,
  ownerEmail: string,
  illustrations: HandoutIllustrations
): Promise<boolean> {
  const docRef = handoutsCol(ownerEmail).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  await docRef.update({
    illustrations,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return true;
}

export async function upsertHandoutIllustration(
  id: string,
  ownerEmail: string,
  passageId: string,
  illustration: HandoutIllustration
): Promise<boolean> {
  const docRef = handoutsCol(ownerEmail).doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  await docRef.update({
    [`illustrations.${passageId}`]: illustration,
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

  await Promise.all([
    docRef.delete(),
    deleteIllustrationFolder(ownerEmail, id).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[handouts] Failed to delete illustration folder: ${message}`);
    }),
  ]);
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
