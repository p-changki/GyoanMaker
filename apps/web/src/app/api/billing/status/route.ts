import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getQuotaStatus } from "@/lib/quota";
import { getSubscription } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  try {
    const [subscription, quota] = await Promise.all([
      getSubscription(email),
      getQuotaStatus(email),
    ]);

    return NextResponse.json({
      subscription,
      quota,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "BILLING_STATUS_ERROR", message } },
      { status: 500 }
    );
  }
}
