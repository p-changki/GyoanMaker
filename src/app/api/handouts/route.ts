import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHandout, listHandouts } from "@/lib/handouts";
import { getQuotaStatus, setStorageUsed } from "@/lib/quota";

/**
 * GET /api/handouts — 내 교안 목록 조회
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  try {
    const handouts = await listHandouts(session.user.email);
    return NextResponse.json({ handouts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts] List failed: ${message}`);
    return NextResponse.json(
      {
        error: {
          code: "LIST_ERROR",
          message: "교안 목록 조회에 실패했습니다.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/handouts — 교안 저장
 * Body: { title, sections, level, model, customTexts? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, sections, level, model, customTexts } = body as {
      title?: string;
      sections?: Record<string, string>;
      level?: string;
      model?: string;
      customTexts?: {
        headerText?: string;
        analysisTitleText?: string;
        summaryTitleText?: string;
      };
    };

    if (!sections || Object.keys(sections).length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_BODY",
            message: "sections 필드가 필요합니다.",
          },
        },
        { status: 400 }
      );
    }

    const [quota, currentHandouts] = await Promise.all([
      getQuotaStatus(session.user.email),
      listHandouts(session.user.email, 1000),
    ]);
    const currentStorageUsed = currentHandouts.length;

    if (
      quota.storage.limit !== null &&
      currentStorageUsed >= quota.storage.limit
    ) {
      return NextResponse.json(
        {
          error: {
            code: "STORAGE_LIMIT_EXCEEDED",
            message:
              "교안 저장 한도를 초과했습니다. 플랜을 업그레이드해 저장 공간을 늘려주세요.",
          },
        },
        { status: 403 }
      );
    }

    const handout = await createHandout({
      ownerEmail: session.user.email,
      title: title || `교안 ${new Date().toLocaleDateString("ko-KR")}`,
      sections,
      level: level || "advanced",
      model: model || "pro",
      customTexts,
    });

    await setStorageUsed(session.user.email, currentStorageUsed + 1);

    return NextResponse.json(handout, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts] Create failed: ${message}`);
    return NextResponse.json(
      { error: { code: "CREATE_ERROR", message: "교안 저장에 실패했습니다." } },
      { status: 500 }
    );
  }
}
