import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cancelSubscription, getSubscription } from "@/lib/subscription";

export async function POST() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const current = await getSubscription(email);

  if (current.tier === "free") {
    return NextResponse.json(
      { error: { code: "ALREADY_FREE", message: "Already on free plan." } },
      { status: 400 }
    );
  }

  if (current.status === "canceled") {
    return NextResponse.json(
      { error: { code: "ALREADY_CANCELED", message: "Subscription is already canceled." } },
      { status: 400 }
    );
  }

  const subscription = await cancelSubscription(email);

  return NextResponse.json({ ok: true, subscription });
}
