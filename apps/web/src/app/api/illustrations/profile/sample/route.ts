import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import { isOwnedStoragePath } from "@/lib/firebase-storage";
import { type PlanId, PLANS } from "@gyoanmaker/shared/plans";
import {
  generateIllustrationSample,
  IllustrationPolicyBlockedError,
} from "@/lib/illustrations";
import type {
  IllustrationAspectRatio,
  IllustrationQuality,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";

interface SampleBody {
  scene?: string;
  quality?: IllustrationQuality;
  aspectRatio?: IllustrationAspectRatio;
  referenceImage?: IllustrationReferenceImage;
}

function isQuality(value: unknown): value is IllustrationQuality {
  return value === "draft" || value === "standard" || value === "hq";
}

function isAspectRatio(value: unknown): value is IllustrationAspectRatio {
  return value === "4:3" || value === "1:1" || value === "16:9";
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
  return {
    imageUrl: obj.imageUrl.trim().slice(0, 2000),
    storagePath: obj.storagePath.trim().slice(0, 500),
    mimeType,
    source,
    width:
      typeof obj.width === "number" && Number.isFinite(obj.width) && obj.width > 0
        ? Math.round(obj.width)
        : undefined,
    height:
      typeof obj.height === "number" && Number.isFinite(obj.height) && obj.height > 0
        ? Math.round(obj.height)
        : undefined,
    updatedAt:
      typeof obj.updatedAt === "string" && obj.updatedAt.trim().length > 0
        ? obj.updatedAt
        : new Date().toISOString(),
  };
}

function getTodayKeyKst(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

async function checkAndIncrementDailyLimit(
  email: string,
  dailyLimit: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const db = getDb();
  const todayKey = getTodayKeyKst();
  const ref = db.collection("users").doc(email.toLowerCase());
  const snap = await ref.get();
  const data = snap.data() ?? {};

  const sampleUsage = (data as Record<string, unknown>).illustrationSampleUsage as
    | { dateKey?: string; count?: number }
    | undefined;

  const currentKey = sampleUsage?.dateKey ?? "";
  const currentCount =
    currentKey === todayKey && typeof sampleUsage?.count === "number"
      ? sampleUsage.count
      : 0;

  if (currentCount >= dailyLimit) {
    return { allowed: false, used: currentCount, limit: dailyLimit };
  }

  await ref.set(
    { illustrationSampleUsage: { dateKey: todayKey, count: currentCount + 1 } },
    { merge: true }
  );

  return { allowed: true, used: currentCount + 1, limit: dailyLimit };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as SampleBody;
    const scene = typeof body.scene === "string" ? body.scene.trim() : "";
    if (!scene) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_BODY",
            message: "scene is required.",
          },
        },
        { status: 400 }
      );
    }

    if (body.quality !== undefined && !isQuality(body.quality)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_QUALITY",
            message: "quality must be one of draft/standard/hq.",
          },
        },
        { status: 400 }
      );
    }

    if (body.aspectRatio !== undefined && !isAspectRatio(body.aspectRatio)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ASPECT_RATIO",
            message: "aspectRatio must be one of 4:3/1:1/16:9.",
          },
        },
        { status: 400 }
      );
    }

    const referenceImage =
      body.referenceImage !== undefined
        ? normalizeReferenceImage(body.referenceImage)
        : undefined;
    if (body.referenceImage !== undefined && !referenceImage) {
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
    if (referenceImage && !isOwnedStoragePath(email, referenceImage.storagePath)) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Invalid storage path.",
          },
        },
        { status: 403 }
      );
    }

    // Resolve user plan for daily limit
    const userDoc = await getDb().collection("users").doc(email.toLowerCase()).get();
    const userData = userDoc.data() as { plan?: { tier?: string } } | undefined;
    const planTier = (userData?.plan?.tier as PlanId) || "free";
    const dailyLimit = PLANS[planTier].dailySampleLimit;

    // Daily rate limit check
    const rateCheck = await checkAndIncrementDailyLimit(email, dailyLimit);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "DAILY_SAMPLE_LIMIT_EXCEEDED",
            message: `일일 테스트 생성 한도(${rateCheck.limit}회)를 초과했습니다.`,
            used: rateCheck.used,
            limit: rateCheck.limit,
          },
        },
        { status: 429 }
      );
    }

    const sample = await generateIllustrationSample(email, {
      scene,
      quality: body.quality,
      aspectRatio: body.aspectRatio,
      referenceImage,
    });
    return NextResponse.json({
      sample,
      dailyUsage: { used: rateCheck.used, limit: rateCheck.limit },
    });
  } catch (error) {
    if (error instanceof IllustrationPolicyBlockedError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: `Blocked by policy keyword: ${error.keyword}`,
            keyword: error.keyword,
          },
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_SAMPLE_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
