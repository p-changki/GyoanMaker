// ── Board Post Types ──────────────────────────────────

export type PostType = "notice" | "secret";

/** List view (content excluded for bandwidth savings) */
export interface PostMeta {
  id: string;
  type: PostType;
  title: string;
  authorEmail: string;
  authorName: string | null;
  pinned: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Detail view (includes content) */
export interface PostDetail extends PostMeta {
  content: string;
  replyEmail: string | null;
}

/** Create input (used by lib layer) */
export interface CreatePostInput {
  type: PostType;
  title: string;
  content: string;
  authorEmail: string;
  authorName: string | null;
  replyEmail?: string;
  password?: string; // raw 4-digit PIN (secret only)
}
