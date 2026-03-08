import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  activateIllustrationSample,
  deactivateIllustrationSample,
} from "@/lib/illustration-samples";

export async function POST(
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
    await activateIllustrationSample(email, sampleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "SAMPLES_ACTIVATE_ERROR", message } },
      { status: 500 }
    );
  }
}

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
    await deactivateIllustrationSample(email, sampleId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "SAMPLES_DEACTIVATE_ERROR", message } },
      { status: 500 }
    );
  }
}
