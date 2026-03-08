import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteIllustrationSample } from "@/lib/illustration-samples";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sampleId: string }> }
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
    const { sampleId } = await params;
    if (!sampleId) {
      return NextResponse.json(
        { error: { code: "INVALID_ID", message: "sampleId is required." } },
        { status: 400 }
      );
    }

    await deleteIllustrationSample(email, sampleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "SAMPLES_DELETE_ERROR", message } },
      { status: 500 }
    );
  }
}
