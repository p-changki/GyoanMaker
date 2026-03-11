import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHandout, listHandouts } from "@/lib/handouts";
import { incrementStorageUsed, reserveStorageSlot } from "@/lib/quota";
import type { HandoutIllustrations, WorkbookData } from "@gyoanmaker/shared/types";

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
    const { title, sections, level, model, customTexts, inputHash, illustrations, workbook } = body as {
      title?: string;
      sections?: Record<string, string>;
      level?: string;
      model?: string;
      inputHash?: string;
      illustrations?: HandoutIllustrations;
      customTexts?: {
        headerText?: string;
        analysisTitleText?: string;
        summaryTitleText?: string;
      };
      workbook?: WorkbookData | null;
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

    if (title && title.trim().length > 255) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_BODY",
            message: "Title must be 255 characters or less.",
          },
        },
        { status: 400 }
      );
    }

    // Atomic: check quota + reserve slot in one transaction
    const reserved = await reserveStorageSlot(session.user.email);
    if (!reserved) {
      return NextResponse.json(
        {
          error: {
            code: "STORAGE_LIMIT_EXCEEDED",
            message: "Storage limit exceeded. Please upgrade your plan.",
          },
        },
        { status: 403 }
      );
    }

    let handout;
    try {
      handout = await createHandout({
        ownerEmail: session.user.email,
        title: title || `Handout ${new Date().toLocaleDateString("en-US")}`,
        sections,
        level: level || "advanced",
        model: model || "pro",
        inputHash: typeof inputHash === "string" ? inputHash : undefined,
        illustrations:
          illustrations && typeof illustrations === "object" ? illustrations : undefined,
        customTexts,
        workbook: workbook ?? undefined,
      });
    } catch (err) {
      // Rollback reserved slot on creation failure
      await incrementStorageUsed(session.user.email, -1);
      throw err;
    }

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
