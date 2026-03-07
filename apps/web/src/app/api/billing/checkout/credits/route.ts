import { NextResponse } from "next/server";

// TODO: TODO: Remove temporary block when payment system is ready
// import { NextRequest } from "next/server";
// import { auth } from "@/auth";
// import { getDb } from "@/lib/firebase-admin";
// import { processPayment } from "@/lib/payment";
// import { TOP_UP_PACKAGES, type TopUpPackageId } from "@gyoanmaker/shared/plans";
// import { addTopUpCredits } from "@/lib/subscription";

/**
 * POST /api/billing/checkout/credits — Top up credits (temporarily blocked)
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_AVAILABLE", message: "Payment system is not available yet." } },
    { status: 503 }
  );
}
