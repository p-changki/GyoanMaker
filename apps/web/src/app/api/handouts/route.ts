import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHandout, listHandouts } from "@/lib/handouts";
import { getQuotaStatus, setStorageUsed } from "@/lib/quota";

/**
 * GET /api/handouts — Get my handout list
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
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
          message: "Failed to fetch handout list.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/handouts — Save handout
 * Body: { title, sections, level, model, customTexts? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, sections, level, model, customTexts, inputHash } = body as {
      title?: string;
      sections?: Record<string, string>;
      level?: string;
      model?: string;
      inputHash?: string;
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
            message: "sections field is required.",
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
              "Storage limit exceeded. Please upgrade your plan.",
          },
        },
        { status: 403 }
      );
    }

    const handout = await createHandout({
      ownerEmail: session.user.email,
      title: title || `Handout ${new Date().toLocaleDateString("en-US")}`,
      sections,
      level: level || "advanced",
      model: model || "pro",
      inputHash: typeof inputHash === "string" ? inputHash : undefined,
      customTexts,
    });

    await setStorageUsed(session.user.email, currentStorageUsed + 1);

    return NextResponse.json(handout, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts] Create failed: ${message}`);
    return NextResponse.json(
      { error: { code: "CREATE_ERROR", message: "Failed to save handout." } },
      { status: 500 }
    );
  }
}
