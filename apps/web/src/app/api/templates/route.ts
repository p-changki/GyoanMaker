import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listTemplates, createTemplate } from "@/lib/templates";
import { getTemplateSettings } from "@/lib/templateSettings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const templates = await listTemplates(session.user.email);
    return NextResponse.json({ data: templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list templates";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  let name: string;
  let settings;
  try {
    const body = await request.json() as { name?: unknown; settings?: unknown };
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: { message: "name is required" } }, { status: 400 });
    }
    name = body.name.trim();
    settings = body.settings ?? await getTemplateSettings(session.user.email);
  } catch {
    return NextResponse.json({ error: { message: "Invalid request body" } }, { status: 400 });
  }

  try {
    const template = await createTemplate(session.user.email, name, settings as import("@gyoanmaker/shared/types").TemplateSettings);
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create template";
    return NextResponse.json({ error: { message } }, { status: 400 });
  }
}
