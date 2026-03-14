import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteStylePreset } from "@/lib/illustration-style-presets";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "Preset ID is required." } },
        { status: 400 }
      );
    }

    await deleteStylePreset(email, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/illustrations/style-presets/[id]] DELETE failed: ${message}`);
    return NextResponse.json(
      { error: { code: "STYLE_PRESET_DELETE_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
