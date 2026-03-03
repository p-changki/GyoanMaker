export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserStatus, deleteUser, type UserStatus } from "@/lib/users";

function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/**
 * PATCH /api/admin/users/[email] — 사용자 상태 변경
 * Body: { status: "approved" | "rejected" | "pending" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await params;
  const body = await req.json();
  const status = body.status as UserStatus;

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const targetEmail = decodeURIComponent(email);
  await updateUserStatus(targetEmail, status);

  return NextResponse.json({ ok: true, email: targetEmail, status });
}

/**
 * DELETE /api/admin/users/[email] — 사용자 삭제
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await params;
  const targetEmail = decodeURIComponent(email);
  await deleteUser(targetEmail);

  return NextResponse.json({ ok: true, email: targetEmail });
}
