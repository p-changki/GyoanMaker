export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import {
  listIllustrationPresets,
  addIllustrationPreset,
  removeIllustrationPreset,
} from "@gyoanmaker/server-lib/illustration-presets";
import { listIllustrationSamples } from "@gyoanmaker/server-lib/illustration-samples";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const presets = await listIllustrationPresets();
  return NextResponse.json({ presets });
}

interface PostBody {
  sampleId?: string;
  ownerEmail?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as PostBody;
  if (!body.sampleId || !body.ownerEmail) {
    return NextResponse.json(
      { error: "sampleId and ownerEmail are required." },
      { status: 400 }
    );
  }

  // Find the sample from the owner's collection
  const samples = await listIllustrationSamples(body.ownerEmail);
  const sample = samples.find((s) => s.sampleId === body.sampleId);
  if (!sample) {
    return NextResponse.json({ error: "Sample not found." }, { status: 404 });
  }

  const preset = await addIllustrationPreset({
    prompt: sample.prompt,
    revisedPrompt: sample.revisedPrompt,
    imageUrl: sample.imageUrl,
    storagePath: sample.storagePath,
    model: sample.model,
    quality: sample.quality,
    aspectRatio: sample.aspectRatio,
    createdAt: sample.createdAt,
  });

  return NextResponse.json({ preset }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const presetId = searchParams.get("presetId");
  if (!presetId) {
    return NextResponse.json(
      { error: "presetId query param required." },
      { status: 400 }
    );
  }

  await removeIllustrationPreset(presetId);
  return NextResponse.json({ ok: true });
}
