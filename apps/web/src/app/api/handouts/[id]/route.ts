import { NextRequest, NextResponse } from "next/server";
import type {
  HandoutIllustrations,
  VocabBankData,
  WorkbookData,
} from "@gyoanmaker/shared/types";
import { auth } from "@/auth";
import {
  getHandout,
  deleteHandout,
  updateHandoutTitle,
  updateHandout,
} from "@/lib/handouts";
import { incrementStorageUsed } from "@/lib/quota";

/**
 * GET /api/handouts/[id] — Get handout detail
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const handout = await getHandout(id, session.user.email);
    if (!handout) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json(handout);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Get failed: ${message}`);
    return NextResponse.json(
      { error: { code: "GET_ERROR", message: "Failed to fetch handout." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/handouts/[id] — Update handout
 * Body: { title?, sections?, illustrations?, customTexts? }
 * At least one field must be provided.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await req.json();
  const { title, sections, illustrations, customTexts, workbook, vocabBank } = body as {
    title?: string;
    sections?: Record<string, string>;
    illustrations?: HandoutIllustrations;
    customTexts?: { headerText?: string; analysisTitleText?: string; summaryTitleText?: string };
    workbook?: WorkbookData | null;
    vocabBank?: VocabBankData | null;
  };

  // Validate title length
  if (title !== undefined && title.trim().length > 255) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Title must be 255 characters or less." } },
      { status: 400 }
    );
  }

  // Validate sections are non-empty if provided
  if (sections !== undefined && Object.keys(sections).length === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "sections must not be empty." } },
      { status: 400 }
    );
  }

  // Title-only update (legacy path from dashboard rename)
  const isFullUpdate =
    sections !== undefined ||
    illustrations !== undefined ||
    customTexts !== undefined ||
    workbook !== undefined ||
    vocabBank !== undefined;

  if (!isFullUpdate) {
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: "At least one field is required." } },
        { status: 400 }
      );
    }

    try {
      const ok = await updateHandoutTitle(id, session.user.email, title.trim());
      if (!ok) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Handout not found." } },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, id, title: title.trim() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[api/handouts/${id}] Update failed: ${message}`);
      return NextResponse.json(
        { error: { code: "UPDATE_ERROR", message: "Failed to update handout." } },
        { status: 500 }
      );
    }
  }

  // Full update (sections, illustrations, customTexts, title)
  try {
    const ok = await updateHandout(id, session.user.email, {
      title: title?.trim(),
      sections,
      illustrations,
      customTexts,
      workbook,
      vocabBank,
    });
    if (!ok) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    console.error(`[api/handouts/${id}] Full update failed: ${message}`);
    console.error(`[api/handouts/${id}] Stack: ${stack}`);
    if (workbook) {
      console.error(`[api/handouts/${id}] Workbook passages: ${workbook.passages?.length}, model: ${workbook.model}`);
    }
    return NextResponse.json(
      { error: { code: "UPDATE_ERROR", message: "Failed to update handout." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/handouts/[id] — Delete handout
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const ok = await deleteHandout(id, session.user.email);
    if (!ok) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }

    // Atomic decrement (O(1)) instead of listing all remaining handouts
    await incrementStorageUsed(session.user.email, -1);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/handouts/${id}] Delete failed: ${message}`);
    return NextResponse.json(
      { error: { code: "DELETE_ERROR", message: "Failed to delete handout." } },
      { status: 500 }
    );
  }
}
