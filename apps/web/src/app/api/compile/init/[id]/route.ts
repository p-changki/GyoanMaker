import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getHandout } from "@/lib/handouts";
import { getTemplateSettings } from "@/lib/templateSettings";

/**
 * GET /api/compile/init/[id]
 *
 * Combined endpoint that returns both handout data and template settings
 * in a single request, eliminating duplicate auth() calls and HTTP round trips.
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
    const [handout, templateSettings] = await Promise.all([
      getHandout(id, session.user.email),
      getTemplateSettings(session.user.email),
    ]);

    if (!handout) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Handout not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ handout, templateSettings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/compile/init/${id}] Failed: ${message}`);
    return NextResponse.json(
      { error: { code: "INIT_ERROR", message: "Failed to load compile data." } },
      { status: 500 }
    );
  }
}
