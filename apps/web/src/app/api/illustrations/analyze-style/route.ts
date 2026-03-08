import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

const ANALYSIS_MODEL = "gemini-2.5-flash";

const ANALYSIS_PROMPT = `You are an art style analyzer for educational illustration profiles.
Analyze the provided image and extract the following style attributes as a JSON object.
Each field should be concise English text suitable for an AI image generation prompt.

Required JSON fields:
- "styleName": Art style name (max 60 chars). e.g. "Korean webtoon, gritty-realistic caricature"
- "palette": Color palette description (max 60 chars). e.g. "warm pastel tones with soft gradients"
- "lineStyle": Line art style (max 60 chars). e.g. "clean line art with uniform stroke width"
- "mood": Overall mood/atmosphere (max 60 chars). e.g. "cheerful, educational, kid-friendly"
- "characterGuide": Character design description (max 300 chars). Describe character proportions, facial features, body style, level of realism/stylization.

Respond with ONLY valid JSON, no markdown fences, no extra text.`;

function getApiKey(): string {
  const key = process.env.GOOGLE_IMAGE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_IMAGE_API_KEY is not configured.");
  return key;
}

interface StyleAnalysisResult {
  styleName: string;
  palette: string;
  lineStyle: string;
  mood: string;
  characterGuide: string;
}

function clamp(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function parseAnalysisResponse(text: string): StyleAnalysisResult | null {
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      styleName: clamp(parsed.styleName, 60),
      palette: clamp(parsed.palette, 60),
      lineStyle: clamp(parsed.lineStyle, 60),
      mood: clamp(parsed.mood, 60),
      characterGuide: clamp(parsed.characterGuide, 300),
    };
  } catch {
    return null;
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
    const body = (await req.json().catch(() => ({}))) as { imageDataUrl?: string };

    if (!body.imageDataUrl || typeof body.imageDataUrl !== "string") {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "imageDataUrl is required." } },
        { status: 400 }
      );
    }

    // Validate data URL format
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(
      body.imageDataUrl.trim()
    );
    if (!match) {
      return NextResponse.json(
        { error: { code: "INVALID_IMAGE", message: "Only png/jpeg/webp data URLs are supported." } },
        { status: 400 }
      );
    }

    const mimeType = match[1]!.toLowerCase();
    const base64Data = match[2]!;

    // Check size (5MB max)
    const byteSize = Math.floor((base64Data.length * 3) / 4);
    if (byteSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: "IMAGE_TOO_LARGE", message: "Image must be 5MB or less." } },
        { status: 400 }
      );
    }

    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: ANALYSIS_PROMPT },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = (response as any).candidates?.[0]?.content?.parts ?? [];
    const responseText = parts
      .filter((p: { text?: string }) => typeof p.text === "string")
      .map((p: { text: string }) => p.text)
      .join("");

    if (!responseText) {
      return NextResponse.json(
        { error: { code: "ANALYSIS_FAILED", message: "Gemini returned no text response." } },
        { status: 502 }
      );
    }

    const result = parseAnalysisResponse(responseText);
    if (!result) {
      return NextResponse.json(
        { error: { code: "PARSE_FAILED", message: "Failed to parse style analysis result." } },
        { status: 502 }
      );
    }

    return NextResponse.json({ analysis: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[analyze-style] Error:", message);
    return NextResponse.json(
      { error: { code: "ANALYSIS_ERROR", message } },
      { status: 500 }
    );
  }
}
