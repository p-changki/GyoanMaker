import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listIllustrationSamples,
  saveIllustrationSample,
} from "@/lib/illustration-samples";
import type {
  IllustrationAspectRatio,
  IllustrationQuality,
} from "@gyoanmaker/shared/types";

interface SaveBody {
  prompt: string;
  revisedPrompt: string;
  imageUrl: string;
  storagePath: string;
  model: string;
  quality: IllustrationQuality;
  aspectRatio: IllustrationAspectRatio;
}

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const samples = await listIllustrationSamples(email);
    return NextResponse.json({ samples });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "SAMPLES_LIST_ERROR", message } },
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
    const body = (await req.json()) as SaveBody;

    if (!body.prompt || !body.imageUrl || !body.storagePath || !body.model) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: "Missing required fields." } },
        { status: 400 }
      );
    }

    const sample = await saveIllustrationSample(email, {
      prompt: body.prompt,
      revisedPrompt: body.revisedPrompt || body.prompt,
      imageUrl: body.imageUrl,
      storagePath: body.storagePath,
      model: body.model,
      quality: body.quality || "standard",
      aspectRatio: body.aspectRatio || "4:3",
    });

    return NextResponse.json({ sample }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "SAMPLES_SAVE_ERROR", message } },
      { status: 500 }
    );
  }
}
