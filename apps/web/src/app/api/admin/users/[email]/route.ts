export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateUserStatus, deleteUser, isAdmin, type UserStatus } from "@/lib/users";

/**
 * PATCH /api/admin/users/[email] — Update user status
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
    return NextResponse.json(
      { error: { code: "INVALID_STATUS", message: "Status must be one of: approved, rejected, pending" } },
      { status: 400 }
    );
  }

  const targetEmail = decodeURIComponent(email);
  await updateUserStatus(targetEmail, status);

  return NextResponse.json({ ok: true, email: targetEmail, status });
}

/**
 * DELETE /api/admin/users/[email] — Delete user
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
