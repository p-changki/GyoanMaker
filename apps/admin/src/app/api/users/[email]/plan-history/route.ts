export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@gyoanmaker/server-lib/users";
import { getPlanHistory } from "@gyoanmaker/server-lib/plan-history";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ email: string }> },
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await params;
  const targetEmail = decodeURIComponent(email);

  try {
    const history = await getPlanHistory(targetEmail);
    return NextResponse.json({ history });
  } catch (error) {
    console.error(
      `[admin/plan-history] Failed for ${targetEmail}:`,
      error,
    );
    return NextResponse.json(
      { error: "Failed to fetch plan history." },
      { status: 500 },
    );
  }
}
