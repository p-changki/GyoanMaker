import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingKeyPublic, deleteBillingKey } from "@/lib/billing-key";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const card = await getBillingKeyPublic(email);
    return NextResponse.json({ ok: true, card });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch billing key.";
    console.error("[billing/billing-key] fetch failed:", message);
    return NextResponse.json(
      {
        error: {
          code: "BILLING_KEY_FETCH_ERROR",
          message: "Failed to fetch billing key.",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    await deleteBillingKey(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete billing key.";
    console.error("[billing/billing-key] delete failed:", message);
    return NextResponse.json(
      {
        error: {
          code: "BILLING_KEY_DELETE_ERROR",
          message: "Failed to delete billing key.",
        },
      },
      { status: 500 }
    );
  }
}
