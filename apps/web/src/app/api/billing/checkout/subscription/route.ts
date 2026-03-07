import { NextResponse } from "next/server";

// TODO: TODO: Remove temporary block when payment system is ready
// import { NextRequest } from "next/server";
// import { auth } from "@/auth";
// import { processPayment } from "@/lib/payment";
// import { type PlanId, PLANS } from "@gyoanmaker/shared/plans";
// import { changePlan } from "@/lib/subscription";
// import { getDb } from "@/lib/firebase-admin";

/**
 * POST /api/billing/checkout/subscription — Change subscription plan (temporarily blocked)
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_AVAILABLE", message: "Payment system is not available yet." } },
    { status: 503 }
  );
}
