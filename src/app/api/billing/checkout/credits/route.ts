import { NextResponse } from "next/server";

// TODO: 결제 시스템 오픈 시 아래 주석 해제하고 임시 차단 제거
// import { NextRequest } from "next/server";
// import { auth } from "@/auth";
// import { getDb } from "@/lib/firebase-admin";
// import { processPayment } from "@/lib/payment";
// import { TOP_UP_PACKAGES, type TopUpPackageId } from "@/lib/plans";
// import { addTopUpCredits } from "@/lib/subscription";

/**
 * POST /api/billing/checkout/credits — 크레딧 충전 (임시 차단)
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_AVAILABLE", message: "결제 시스템 준비중입니다." } },
    { status: 503 }
  );
}
