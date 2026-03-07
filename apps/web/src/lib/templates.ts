import { getDb } from "./firebase-admin";
import type { TemplateSettings } from "@gyoanmaker/shared/types";
import type { SavedTemplate } from "@gyoanmaker/shared/types";

const MAX_TEMPLATES = 20;

export async function listTemplates(email: string): Promise<SavedTemplate[]> {
  const key = email.toLowerCase();
  const snap = await getDb()
    .collection("users")
    .doc(key)
    .collection("templates")
    .orderBy("updatedAt", "desc")
    .limit(MAX_TEMPLATES)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SavedTemplate));
}

export async function createTemplate(
  email: string,
  name: string,
  settings: TemplateSettings
): Promise<SavedTemplate> {
  const key = email.toLowerCase();
  const colRef = getDb().collection("users").doc(key).collection("templates");

  const existing = await colRef.count().get();
  if (existing.data().count >= MAX_TEMPLATES) {
    throw new Error(`템플릿은 최대 ${MAX_TEMPLATES}개까지 저장할 수 있습니다.`);
  }

  const now = new Date().toISOString();
  const docRef = await colRef.add({
    name: name.slice(0, 30),
    settings,
    createdAt: now,
    updatedAt: now,
  });

  return { id: docRef.id, name: name.slice(0, 30), settings, createdAt: now, updatedAt: now };
}

export async function deleteTemplate(email: string, templateId: string): Promise<void> {
  const key = email.toLowerCase();
  await getDb()
    .collection("users")
    .doc(key)
    .collection("templates")
    .doc(templateId)
    .delete();
}
