import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listStylePresets,
  saveStylePreset,
} from "@/lib/illustration-style-presets";
import type {
  IllustrationQuality,
  IllustrationAspectRatio,
} from "@gyoanmaker/shared/types";

function isQuality(v: unknown): v is IllustrationQuality {
  return v === "draft" || v === "standard" || v === "hq";
}

function isAspectRatio(v: unknown): v is IllustrationAspectRatio {
  return v === "4:3" || v === "1:1" || v === "16:9";
}

function clamp(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
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
    const presets = await listStylePresets(email);
    return NextResponse.json({ presets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/illustrations/style-presets] GET failed: ${message}`);
    return NextResponse.json(
      { error: { code: "STYLE_PRESET_LIST_ERROR", message: "Internal server error" } },
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
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const name = clamp(body.name, 40);
    if (!name) {
      return NextResponse.json(
        { error: { code: "INVALID_NAME", message: "Preset name is required (max 40 chars)." } },
        { status: 400 }
      );
    }

    const preset = await saveStylePreset(email, {
      name,
      styleName: clamp(body.styleName, 60),
      palette: clamp(body.palette, 60),
      lineStyle: clamp(body.lineStyle, 60),
      mood: clamp(body.mood, 60),
      characterGuide: clamp(body.characterGuide, 300),
      negativePrompt: clamp(body.negativePrompt, 400),
      defaultQuality: isQuality(body.defaultQuality) ? body.defaultQuality : "standard",
      aspectRatio: isAspectRatio(body.aspectRatio) ? body.aspectRatio : "16:9",
    });

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/illustrations/style-presets] POST failed: ${message}`);
    return NextResponse.json(
      { error: { code: "STYLE_PRESET_SAVE_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
