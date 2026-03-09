import { getDb } from "../firebase-admin";
import { hashPassword } from "./password";
import type { PostMeta, PostDetail, CreatePostInput } from "./types";

// ── Constants ──────────────────────────────────────────

const COLLECTION = "posts";
const DEFAULT_LIMIT = 50;

// ── Helpers ────────────────────────────────────────────

function postsCol() {
  return getDb().collection(COLLECTION);
}

function docToMeta(
  id: string,
  d: FirebaseFirestore.DocumentData
): PostMeta {
  return {
    id,
    type: d.type,
    title: d.title,
    authorEmail: d.authorEmail,
    authorName: d.authorName ?? null,
    pinned: d.pinned ?? false,
    hasPassword: typeof d.passwordHash === "string" && d.passwordHash.length > 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// ── Create ─────────────────────────────────────────────

export async function createPost(
  input: CreatePostInput
): Promise<PostMeta> {
  const now = new Date().toISOString();
  const email = input.authorEmail.toLowerCase();

  const passwordHash =
    input.type === "secret" && input.password
      ? await hashPassword(input.password)
      : null;

  const docRef = postsCol().doc();

  const data = {
    type: input.type,
    title: input.title,
    content: input.content,
    authorEmail: email,
    authorName: input.authorName,
    replyEmail: input.replyEmail ?? null,
    pinned: input.type === "notice",
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(data);

  return {
    id: docRef.id,
    type: data.type,
    title: data.title,
    authorEmail: email,
    authorName: data.authorName,
    pinned: data.pinned,
    hasPassword: passwordHash !== null,
    createdAt: now,
    updatedAt: now,
  };
}

// ── List ───────────────────────────────────────────────

export async function listPosts(
  limit: number = DEFAULT_LIMIT
): Promise<PostMeta[]> {
  // Single-field orderBy avoids composite index requirement.
  // Pinned (notices) sorting is done client-side.
  const snapshot = await postsCol()
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const posts = snapshot.docs.map((doc) => docToMeta(doc.id, doc.data()));

  // Pinned posts first, then by createdAt desc (already sorted)
  return posts.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return 0; // createdAt order preserved from Firestore
  });
}

// ── Get ────────────────────────────────────────────────

export async function getPost(
  id: string
): Promise<(PostDetail & { passwordHash: string | null }) | null> {
  const doc = await postsCol().doc(id).get();
  if (!doc.exists) return null;

  const d = doc.data()!;
  return {
    ...docToMeta(doc.id, d),
    content: d.content ?? "",
    replyEmail: d.replyEmail ?? null,
    passwordHash: d.passwordHash ?? null,
  };
}

// ── Delete ─────────────────────────────────────────────

export async function deletePost(id: string): Promise<boolean> {
  const docRef = postsCol().doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return false;

  await docRef.delete();
  return true;
}
