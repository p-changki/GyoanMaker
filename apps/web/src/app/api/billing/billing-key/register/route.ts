import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueBillingKey, saveBillingKey } from "@/lib/billing-key";
import { createCustomerKey } from "@/lib/toss-utils";

interface RegisterBody {
  authKey?: string;
  customerKey?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as RegisterBody;
  const authKey = typeof body.authKey === "string" ? body.authKey.trim() : "";
  const customerKey = typeof body.customerKey === "string" ? body.customerKey.trim() : "";

  if (!authKey || !customerKey) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "authKey and customerKey are required.",
        },
      },
      { status: 400 }
    );
  }

  const expectedCustomerKey = createCustomerKey(email);
  if (customerKey !== expectedCustomerKey) {
    return NextResponse.json(
      {
        error: {
          code: "CUSTOMER_KEY_MISMATCH",
          message: "customerKey does not match the authenticated user.",
        },
      },
      { status: 403 }
    );
  }

  try {
    const issued = await issueBillingKey(authKey, customerKey);

    await saveBillingKey(email, {
      key: issued.billingKey,
      customerKey,
      cardCompany: issued.cardCompany,
      cardNumber: issued.cardNumber,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      card: {
        cardCompany: issued.cardCompany,
        cardNumber: issued.cardNumber,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing key registration failed.";
    console.error("[billing/billing-key/register] issue failed:", message);
    return NextResponse.json(
      {
        error: {
          code: "BILLING_KEY_ISSUE_ERROR",
          message: "Billing key registration failed.",
        },
      },
      { status: 500 }
    );
  }
}
