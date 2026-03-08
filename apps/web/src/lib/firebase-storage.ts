import { createHash, randomUUID } from "crypto";
import { getStorageBucket } from "./firebase-admin";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365; // 365 days

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, "_")
    .replace(/_+/g, "_");
}

function stripDataUriPrefix(base64: string): { mimeType: string; payload: string } {
  const trimmed = base64.trim();
  const match = /^data:(.+);base64,(.+)$/i.exec(trimmed);
  if (!match) {
    return {
      mimeType: "image/png",
      payload: trimmed,
    };
  }
  return {
    mimeType: match[1] || "image/png",
    payload: match[2] || "",
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashOwnerKey(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 24);
}

function getSignedUrlTtlSeconds(): number {
  const raw = Number(process.env.ILLUSTRATION_SIGNED_URL_TTL_SECONDS || "");
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SIGNED_URL_TTL_SECONDS;
  }
  return Math.min(Math.floor(raw), MAX_SIGNED_URL_TTL_SECONDS);
}

async function createSignedReadUrl(storagePath: string): Promise<string> {
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  const expiresAt = Date.now() + getSignedUrlTtlSeconds() * 1000;
  const [url] = await file.getSignedUrl({
    action: "read",
    // v2 supports longer expirations; v4 is capped at 7 days.
    version: "v2",
    expires: expiresAt,
  });
  return url;
}

function extensionFromContentType(contentType: string): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

export function buildIllustrationStoragePrefix(email: string, handoutId: string): string {
  return `illustrations/${hashOwnerKey(email)}/${sanitizeSegment(handoutId)}`;
}

function buildLegacyIllustrationStoragePrefix(email: string, handoutId: string): string {
  return `illustrations/${sanitizeSegment(normalizeEmail(email))}/${sanitizeSegment(handoutId)}`;
}

export function buildIllustrationStoragePath(
  email: string,
  handoutId: string,
  passageId: string,
  extension = "png"
): string {
  const prefix = buildIllustrationStoragePrefix(email, handoutId);
  return `${prefix}/${sanitizeSegment(passageId)}.${extension}`;
}

export function buildIllustrationReferenceStoragePath(
  email: string,
  extension = "png"
): string {
  const prefix = buildIllustrationStoragePrefix(email, "_reference");
  return `${prefix}/${randomUUID()}.${extension}`;
}

export async function uploadIllustrationBase64(params: {
  email: string;
  handoutId: string;
  passageId: string;
  base64Data: string;
  contentType?: string;
}): Promise<{ imageUrl: string; storagePath: string; contentType: string }> {
  const bucket = getStorageBucket();
  const parsed = stripDataUriPrefix(params.base64Data);
  const contentType = params.contentType ?? parsed.mimeType;
  const extension =
    contentType === "image/svg+xml" ? "svg" : extensionFromContentType(contentType);
  const storagePath = buildIllustrationStoragePath(
    params.email,
    params.handoutId,
    params.passageId,
    extension
  );
  const file = bucket.file(storagePath);
  const buffer = Buffer.from(parsed.payload, "base64");

  await file.save(buffer, {
    resumable: false,
    validation: false,
    contentType,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
    },
  });

  return {
    storagePath,
    contentType,
    imageUrl: await createSignedReadUrl(storagePath),
  };
}

export async function uploadIllustrationReferenceImageBase64(params: {
  email: string;
  base64Data: string;
  contentType?: "image/png" | "image/jpeg" | "image/webp";
}): Promise<{
  imageUrl: string;
  storagePath: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
}> {
  const bucket = getStorageBucket();
  const parsed = stripDataUriPrefix(params.base64Data);
  const rawContentType = params.contentType ?? parsed.mimeType;
  const contentType =
    rawContentType === "image/jpeg" || rawContentType === "image/webp"
      ? rawContentType
      : "image/png";
  const extension = extensionFromContentType(contentType);
  const storagePath = buildIllustrationReferenceStoragePath(params.email, extension);
  const file = bucket.file(storagePath);
  const buffer = Buffer.from(parsed.payload, "base64");

  await file.save(buffer, {
    resumable: false,
    validation: false,
    contentType,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
    },
  });

  return {
    storagePath,
    contentType,
    imageUrl: await createSignedReadUrl(storagePath),
  };
}

export async function getIllustrationSignedReadUrl(
  storagePath: string
): Promise<string> {
  return createSignedReadUrl(storagePath);
}

export async function readIllustrationImageBase64(storagePath: string): Promise<{
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  data: string;
}> {
  const bucket = getStorageBucket();
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`Reference image not found: ${storagePath}`);
  }

  const [buffer] = await file.download();
  const [metadata] = await file.getMetadata();
  const contentType =
    metadata.contentType === "image/jpeg" || metadata.contentType === "image/webp"
      ? metadata.contentType
      : "image/png";

  return {
    mimeType: contentType,
    data: buffer.toString("base64"),
  };
}

export async function deleteIllustrationImage(storagePath: string): Promise<void> {
  const bucket = getStorageBucket();
  await bucket
    .file(storagePath)
    .delete()
    .catch((error: unknown) => {
      if (error instanceof Error && /No such object/i.test(error.message)) {
        return;
      }
      throw error;
    });
}

export async function deleteIllustrationFolder(
  email: string,
  handoutId: string
): Promise<void> {
  const bucket = getStorageBucket();
  const prefixes = new Set<string>([
    `${buildIllustrationStoragePrefix(email, handoutId)}/`,
    `${buildLegacyIllustrationStoragePrefix(email, handoutId)}/`,
  ]);

  await Promise.all(
    Array.from(prefixes).map((prefix) =>
      bucket.deleteFiles({ prefix }).catch((error: unknown) => {
        if (error instanceof Error && /No such object/i.test(error.message)) {
          return;
        }
        throw error;
      })
    )
  );
}
