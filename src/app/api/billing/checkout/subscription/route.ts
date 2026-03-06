import { NextResponse } from "next/server";

// TODO: 결제 시스템 오픈 시 아래 주석 해제하고 임시 차단 제거
// import { NextRequest } from "next/server";
// import { auth } from "@/auth";
// import { processPayment } from "@/lib/payment";
// import { type PlanId, PLANS } from "@/lib/plans";
// import { changePlan } from "@/lib/subscription";
// import { getDb } from "@/lib/firebase-admin";

/**
 * POST /api/billing/checkout/subscription — 구독 플랜 변경 (임시 차단)
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_AVAILABLE", message: "결제 시스템 준비중입니다." } },
    { status: 503 }
  );
}
