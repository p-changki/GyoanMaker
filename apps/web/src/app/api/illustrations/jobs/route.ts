import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createIllustrationJob,
  getIllustrationCredits,
  IllustrationCreditError,
  IllustrationJobConflictError,
  IllustrationPolicyBlockedError,
  listIllustrationJobs,
} from "@/lib/illustrations";
import type {
  IllustrationAspectRatio,
  IllustrationBubbleStyle,
  IllustrationConceptMode,
  IllustrationQuality,
  IllustrationReferenceImage,
} from "@gyoanmaker/shared/types";

interface CreateJobBody {
  handoutId?: string;
  scope?: "all" | "passages" | "stale";
  passageIds?: string[];
  quality?: IllustrationQuality;
  aspectRatio?: IllustrationAspectRatio;
  overwritePolicy?: "skip_completed" | "overwrite_all" | "stale_only";
  referenceImage?: IllustrationReferenceImage;
  conceptMode?: IllustrationConceptMode;
  conceptText?: string;
  includeKoreanText?: boolean;
  bubbleCount?: number;
  bubbleStyle?: IllustrationBubbleStyle;
  customBubbleTexts?: string[];
}

function isQuality(value: unknown): value is IllustrationQuality {
  return value === "draft" || value === "standard" || value === "hq";
}

function isAspectRatio(value: unknown): value is IllustrationAspectRatio {
  return value === "4:3" || value === "1:1" || value === "16:9";
}

function isScope(value: unknown): value is "all" | "passages" | "stale" {
  return value === "all" || value === "passages" || value === "stale";
}

function isConceptMode(value: unknown): value is IllustrationConceptMode {
  return value === "off" || value === "soft" || value === "hard";
}

function isOverwritePolicy(
  value: unknown
): value is "skip_completed" | "overwrite_all" | "stale_only" {
  return (
    value === "skip_completed" || value === "overwrite_all" || value === "stale_only"
  );
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

export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const handoutId = searchParams.get("handoutId")?.trim() || undefined;
    const activeOnly = searchParams.get("activeOnly") === "true";
    const limitRaw = Number(searchParams.get("limit") || "");
    const limit = Number.isFinite(limitRaw) ? Math.floor(limitRaw) : undefined;

    const jobs = await listIllustrationJobs(email, {
      handoutId,
      activeOnly,
      limit,
    });
    const credits = await getIllustrationCredits(email);

    return NextResponse.json({ jobs, credits });
  } catch (error) {
    
    if (error instanceof Error && error.message.includes("No eligible passages")) {
      return NextResponse.json(
        { error: { code: "NO_ELIGIBLE_PASSAGES", message: "생성할 대상이 없습니다. 모든 일러스트가 이미 완료되었습니다. '전부 새로 생성' 옵션을 선택해주세요." } },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_JOB_LIST_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
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
    const body = (await req.json().catch(() => ({}))) as CreateJobBody;
    if (!body.handoutId || typeof body.handoutId !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_BODY",
            message: "handoutId is required.",
          },
        },
        { status: 400 }
      );
    }

    const scope = isScope(body.scope) ? body.scope : "all";
    const quality = body.quality !== undefined ? body.quality : undefined;
    const aspectRatio = body.aspectRatio !== undefined ? body.aspectRatio : undefined;
    const overwritePolicy = body.overwritePolicy !== undefined ? body.overwritePolicy : undefined;

    if (quality !== undefined && !isQuality(quality)) {
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

    if (aspectRatio !== undefined && !isAspectRatio(aspectRatio)) {
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

    if (overwritePolicy !== undefined && !isOverwritePolicy(overwritePolicy)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_OVERWRITE_POLICY",
            message: "overwritePolicy must be one of skip_completed/overwrite_all/stale_only.",
          },
        },
        { status: 400 }
      );
    }

    const passageIds =
      Array.isArray(body.passageIds) && scope === "passages"
        ? body.passageIds.filter((id): id is string => typeof id === "string" && !!id.trim())
        : undefined;
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

    const conceptMode =
      body.conceptMode !== undefined && isConceptMode(body.conceptMode)
        ? body.conceptMode
        : undefined;
    const conceptText =
      typeof body.conceptText === "string" && body.conceptText.trim().length > 0
        ? body.conceptText.trim().slice(0, 300)
        : undefined;

    const job = await createIllustrationJob(email, {
      handoutId: body.handoutId,
      scope,
      passageIds,
      quality,
      aspectRatio,
      overwritePolicy,
      referenceImage,
      conceptMode,
      conceptText,
      includeKoreanText: typeof body.includeKoreanText === "boolean" ? body.includeKoreanText : undefined,
      bubbleCount: typeof body.bubbleCount === "number" && body.bubbleCount >= 1 && body.bubbleCount <= 5 ? Math.floor(body.bubbleCount) : undefined,
      bubbleStyle: body.bubbleStyle === "round" || body.bubbleStyle === "square" || body.bubbleStyle === "cloud" ? body.bubbleStyle : undefined,
      customBubbleTexts: Array.isArray(body.customBubbleTexts) ? body.customBubbleTexts.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map(t => t.trim().slice(0, 100)).slice(0, 5) : undefined,
    });
    const credits = await getIllustrationCredits(email);

    return NextResponse.json(
      {
        jobId: job.id,
        total: job.total,
        reservedCredits: job.reservedCredits,
        estimatedSeconds: Math.max(15, job.total * 8),
        credits,
        job,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof IllustrationCreditError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: "Insufficient illustration credits.",
            needed: error.needed,
            available: error.available,
          },
        },
        { status: 402 }
      );
    }

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

    if (error instanceof IllustrationJobConflictError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: "Another illustration job is already running for this handout.",
            jobId: error.jobId,
          },
        },
        { status: 409 }
      );
    }

    
    if (error instanceof Error && error.message.includes("No eligible passages")) {
      return NextResponse.json(
        { error: { code: "NO_ELIGIBLE_PASSAGES", message: "생성할 대상이 없습니다. 모든 일러스트가 이미 완료되었습니다. '전부 새로 생성' 옵션을 선택해주세요." } },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: {
          code: "ILLUSTRATION_JOB_CREATE_ERROR",
          message,
        },
      },
      { status: 500 }
    );
  }
}
