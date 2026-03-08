import { randomUUID } from "crypto";
import { getStorageBucket } from "./firebase-admin";

function encodePath(path: string): string {
  return encodeURIComponent(path).replace(/%2F/g, "%2F");
}

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

function buildDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const encodedPath = encodePath(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}

function extensionFromContentType(contentType: string): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return "png";
}

export function buildIllustrationStoragePrefix(email: string, handoutId: string): string {
  return `illustrations/${sanitizeSegment(email)}/${sanitizeSegment(handoutId)}`;
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
  const token = randomUUID();
  const buffer = Buffer.from(parsed.payload, "base64");

  await file.save(buffer, {
    resumable: false,
    validation: false,
    contentType,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    storagePath,
    contentType,
    imageUrl: buildDownloadUrl(bucket.name, storagePath, token),
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
  const token = randomUUID();
  const buffer = Buffer.from(parsed.payload, "base64");

  await file.save(buffer, {
    resumable: false,
    validation: false,
    contentType,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    storagePath,
    contentType,
    imageUrl: buildDownloadUrl(bucket.name, storagePath, token),
  };
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
  const prefix = `${buildIllustrationStoragePrefix(email, handoutId)}/`;
  await bucket.deleteFiles({ prefix }).catch((error: unknown) => {
    if (error instanceof Error && /No such object/i.test(error.message)) {
      return;
    }
    throw error;
  });
}
