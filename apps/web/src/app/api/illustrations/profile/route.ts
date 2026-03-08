import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getIllustrationCredits,
  getIllustrationProfile,
  updateIllustrationProfile,
} from "@/lib/illustrations";
import { uploadIllustrationReferenceImageBase64 } from "@/lib/firebase-storage";
import type {
  IllustrationAspectRatio,
  IllustrationProfile,
  IllustrationQuality,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";

interface ProfileBody {
  styleName?: string;
  characterGuide?: string;
  palette?: string;
  lineStyle?: string;
  mood?: string;
  negativePrompt?: string;
  bannedKeywords?: string[];
  defaultQuality?: IllustrationQuality;
  aspectRatio?: IllustrationAspectRatio;
  referenceImage?: IllustrationReferenceImage | null;
  referenceImageDataUrl?: string;
  styleEnabled?: boolean;
}

function isQuality(value: unknown): value is IllustrationQuality {
  return value === "draft" || value === "standard" || value === "hq";
}

function isAspectRatio(value: unknown): value is IllustrationAspectRatio {
  return value === "4:3" || value === "1:1" || value === "16:9";
}

function clampText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, maxLength);
}

function parseDataUrl(
  value: string
): { mimeType: "image/png" | "image/jpeg" | "image/webp"; payload: string } | null {
  const match = /^data:(image\/png|image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
    value.trim()
  );
  if (!match) return null;
  const mimeType = match[1]?.toLowerCase();
  if (mimeType !== "image/png" && mimeType !== "image/jpeg" && mimeType !== "image/webp") {
    return null;
  }
  return {
    mimeType,
    payload: match[2] ?? "",
  };
}

function normalizeReferenceImage(
  value: unknown
): IllustrationReferenceImage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Partial<IllustrationReferenceImage>;
  if (typeof obj.imageUrl !== "string" || !obj.imageUrl.trim()) return undefined;
  if (typeof obj.storagePath !== "string" || !obj.storagePath.trim()) return undefined;
  const mimeType =
    obj.mimeType === "image/jpeg" || obj.mimeType === "image/webp"
      ? obj.mimeType
      : "image/png";
  const source = obj.source === "sample" ? "sample" : "upload";
  const width =
    typeof obj.width === "number" && Number.isFinite(obj.width) && obj.width > 0
      ? Math.round(obj.width)
      : undefined;
  const height =
    typeof obj.height === "number" && Number.isFinite(obj.height) && obj.height > 0
      ? Math.round(obj.height)
      : undefined;

  return {
    imageUrl: obj.imageUrl.trim().slice(0, 2000),
    storagePath: obj.storagePath.trim().slice(0, 500),
    mimeType,
    source,
    width,
    height,
    updatedAt:
      typeof obj.updatedAt === "string" && obj.updatedAt.trim().length > 0
        ? obj.updatedAt
        : new Date().toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const [profile, credits] = await Promise.all([
      getIllustrationProfile(email),
      getIllustrationCredits(email),
    ]);

    return NextResponse.json({ profile, credits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_PROFILE_GET_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as ProfileBody;
    const patch: Omit<Partial<IllustrationProfile>, "referenceImage"> & {
      referenceImage?: IllustrationReferenceImage | null;
    } = {};

    const styleName = clampText(body.styleName, 60);
    if (styleName !== undefined) patch.styleName = styleName;

    const characterGuide = clampText(body.characterGuide, 300);
    if (characterGuide !== undefined) patch.characterGuide = characterGuide;

    const palette = clampText(body.palette, 60);
    if (palette !== undefined) patch.palette = palette;

    const lineStyle = clampText(body.lineStyle, 60);
    if (lineStyle !== undefined) patch.lineStyle = lineStyle;

    const mood = clampText(body.mood, 60);
    if (mood !== undefined) patch.mood = mood;

    const negativePrompt = clampText(body.negativePrompt, 400);
    if (negativePrompt !== undefined) patch.negativePrompt = negativePrompt;

    if (body.defaultQuality !== undefined) {
      if (!isQuality(body.defaultQuality)) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_QUALITY",
              message: "defaultQuality must be one of draft/standard/hq.",
            },
          },
          { status: 400 }
        );
      }
      patch.defaultQuality = body.defaultQuality;
    }

    if (body.aspectRatio !== undefined) {
      if (!isAspectRatio(body.aspectRatio)) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ASPECT_RATIO",
              message: "aspectRatio must be one of 4:3, 1:1, 16:9.",
            },
          },
          { status: 400 }
        );
      }
      patch.aspectRatio = body.aspectRatio;
    }

    if (body.bannedKeywords !== undefined) {
      if (!Array.isArray(body.bannedKeywords)) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_BANNED_KEYWORDS",
              message: "bannedKeywords must be a string array.",
            },
          },
          { status: 400 }
        );
      }
      patch.bannedKeywords = body.bannedKeywords
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20);
    }


    if (body.styleEnabled !== undefined) {
      if (typeof body.styleEnabled !== "boolean") {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_STYLE_ENABLED",
              message: "styleEnabled must be a boolean.",
            },
          },
          { status: 400 }
        );
      }
      patch.styleEnabled = body.styleEnabled;
    }
    if (body.referenceImage === null) {
      patch.referenceImage = null;
    } else if (body.referenceImage !== undefined) {
      const normalized = normalizeReferenceImage(body.referenceImage);
      if (!normalized) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_REFERENCE_IMAGE",
              message: "referenceImage has invalid shape.",
            },
          },
          { status: 400 }
        );
      }
      patch.referenceImage = normalized;
    }

    if (body.referenceImageDataUrl !== undefined) {
      if (typeof body.referenceImageDataUrl !== "string" || !body.referenceImageDataUrl.trim()) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_REFERENCE_IMAGE_DATA",
              message: "referenceImageDataUrl must be a data URL string.",
            },
          },
          { status: 400 }
        );
      }
      const parsed = parseDataUrl(body.referenceImageDataUrl);
      if (!parsed) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_REFERENCE_IMAGE_DATA",
              message: "Only png/jpeg/webp data URL is supported.",
            },
          },
          { status: 400 }
        );
      }
      const byteSize = Math.floor((parsed.payload.length * 3) / 4);
      const maxBytes = 5 * 1024 * 1024;
      if (byteSize > maxBytes) {
        return NextResponse.json(
          {
            error: {
              code: "REFERENCE_IMAGE_TOO_LARGE",
              message: "reference image must be 5MB or less.",
            },
          },
          { status: 400 }
        );
      }

      const uploaded = await uploadIllustrationReferenceImageBase64({
        email,
        base64Data: body.referenceImageDataUrl,
        contentType: parsed.mimeType,
      });
      patch.referenceImage = {
        imageUrl: uploaded.imageUrl,
        storagePath: uploaded.storagePath,
        mimeType: uploaded.contentType,
        source: "upload",
        updatedAt: new Date().toISOString(),
      };
    }

    const profile = await updateIllustrationProfile(email, patch);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_PROFILE_PATCH_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
