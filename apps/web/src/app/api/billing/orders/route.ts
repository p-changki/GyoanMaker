import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserOrders } from "@/lib/orders";

const MAX_LIMIT = 200;

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const orders = await getUserOrders(email, MAX_LIMIT);
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[api/billing/orders] Failed to fetch orders: ${message}`);
    return NextResponse.json(
      { error: { code: "ORDERS_FETCH_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
