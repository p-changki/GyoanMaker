import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteTemplate } from "@/lib/templates";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: { message: "Missing template id" } }, { status: 400 });
  }

  try {
    await deleteTemplate(session.user.email, id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete template";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
