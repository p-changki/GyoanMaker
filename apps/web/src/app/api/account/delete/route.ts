import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { softDeleteUser } from "@/lib/users";
import { deleteAllHandouts } from "@/lib/handouts";

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Delete all handouts subcollection first
    const deletedCount = await deleteAllHandouts(email);

    // 2. Soft-delete the user document (keeps record visible to admin)
    await softDeleteUser(email);

    return NextResponse.json({
      ok: true,
      email,
      deletedHandouts: deletedCount,
    });
  } catch (err) {
    console.error("[account/delete] Failed:", err);
    return NextResponse.json(
      { error: "Error occurred while deleting account." },
      { status: 500 }
    );
  }
}
