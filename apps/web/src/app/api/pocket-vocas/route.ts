import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listPocketVocas, createPocketVoca } from "@/lib/pocketVocas";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }

  try {
    const items = await listPocketVocas(email);
    const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ items: sorted });
  } catch (error) {
    console.error("[api/pocket-vocas] GET error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to load pocket vocas." } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "Request body must be an object." } }, { status: 400 });
    }

    const { title, passageCount, model, data, config, handoutId, handoutTitle } = body as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "title is required." } }, { status: 400 });
    }

    if (model !== "flash" && model !== "pro") {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: 'model must be "flash" or "pro".' } }, { status: 400 });
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "data is required." } }, { status: 400 });
    }

    const id = await createPocketVoca({
      ownerEmail: email,
      title: String(title).trim(),
      passageCount: Number(passageCount) || 0,
      model: model as "flash" | "pro",
      data: data as never,
      config: (config as never) ?? { sheetCode: "", sheetTitle: "", sectionLabel: "", rangeDescription: "", teacherName: "" },
      handoutId: typeof handoutId === "string" ? handoutId : "",
      handoutTitle: typeof handoutTitle === "string" ? handoutTitle : "",
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[api/pocket-vocas] POST error:", error);
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to save pocket voca." } }, { status: 500 });
  }
}
