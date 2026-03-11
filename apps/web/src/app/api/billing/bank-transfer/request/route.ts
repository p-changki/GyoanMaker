import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/firebase-admin";
import { sendOrderReceivedEmail } from "@/lib/email";
import {
  type PendingOrder,
  type PlanId,
  PLANS,
  TOP_UP_PACKAGES,
  type TopUpPackageId,
  toVatInclusiveAmount,
} from "@gyoanmaker/shared/plans";

interface BankTransferRequestBody {
  type?: "plan" | "topup";
  planId?: PlanId;
  packageId?: TopUpPackageId;
  depositorName?: string;
  receiptType?: "none" | "cash_receipt" | "tax_invoice";
  receiptPhone?: string;
  taxInvoiceInfo?: {
    businessNumber?: string;
    companyName?: string;
    representative?: string;
    email?: string;
    businessType?: string;
    businessItem?: string;
    address?: string;
  };
}

function isPlanId(value: unknown): value is PlanId {
  return value === "basic" || value === "standard" || value === "pro";
}

function isTopUpPackageId(value: unknown): value is TopUpPackageId {
  return (
    value === "illu_20" ||
    value === "illu_50" ||
    value === "illu_100" ||
    value === "pro_20" ||
    value === "pro_60" ||
    value === "flash_100"
  );
}

function createOrderId(): string {
  return `ord_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
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

  // Duplicate check: prevent multiple awaiting_deposit orders
  const db = getDb();
  const existingSnap = await db
    .collection("pending_orders")
    .where("email", "==", email)
    .where("checkoutFlow", "==", "bank_transfer")
    .where("status", "==", "awaiting_deposit")
    .limit(1)
    .get();

  if (!existingSnap.empty) {
    return NextResponse.json(
      {
        error: {
          code: "DUPLICATE_ORDER",
          message: "이미 입금 대기 중인 주문이 있습니다. 기존 주문을 취소한 후 다시 신청해주세요.",
        },
      },
      { status: 409 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as BankTransferRequestBody;

  if (body.type !== "plan" && body.type !== "topup") {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Valid type is required. (plan | topup)" } },
      { status: 400 }
    );
  }

  const depositorName = typeof body.depositorName === "string" ? body.depositorName.trim() : "";
  if (!depositorName) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "depositorName is required." } },
      { status: 400 }
    );
  }

  let supplyAmount = 0;
  let vatAmount = 0;
  let amount = 0;
  let orderName = "";
  let planId: PlanId | undefined;
  let packageId: TopUpPackageId | undefined;

  if (body.type === "plan") {
    if (!isPlanId(body.planId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PLAN", message: "Valid planId is required. (basic | standard | pro)" } },
        { status: 400 }
      );
    }

    planId = body.planId;
    const vatBreakdown = toVatInclusiveAmount(PLANS[planId].price);
    supplyAmount = vatBreakdown.supplyAmount;
    vatAmount = vatBreakdown.vatAmount;
    amount = vatBreakdown.totalAmount;
    orderName = `GyoanMaker ${planId.toUpperCase()} 이용권`;
  }

  if (body.type === "topup") {
    if (!isTopUpPackageId(body.packageId)) {
      return NextResponse.json(
        { error: { code: "INVALID_PACKAGE", message: "Valid packageId is required." } },
        { status: 400 }
      );
    }

    const selectedPackage = TOP_UP_PACKAGES.find((pkg) => pkg.id === body.packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { error: { code: "PACKAGE_NOT_FOUND", message: "Top-up package not found." } },
        { status: 404 }
      );
    }

    packageId = selectedPackage.id;
    const vatBreakdown = toVatInclusiveAmount(selectedPackage.price);
    supplyAmount = vatBreakdown.supplyAmount;
    vatAmount = vatBreakdown.vatAmount;
    amount = vatBreakdown.totalAmount;
    orderName = `GyoanMaker ${selectedPackage.label}`;
  }

  const orderId = createOrderId();
  const createdAt = new Date().toISOString();

  const receiptType = body.receiptType === "cash_receipt" || body.receiptType === "tax_invoice"
    ? body.receiptType
    : "none" as const;

  const receiptPhone =
    receiptType === "cash_receipt" && typeof body.receiptPhone === "string"
      ? body.receiptPhone.replace(/[^0-9-]/g, "").trim()
      : undefined;

  const taxInvoiceInfo =
    receiptType === "tax_invoice" && body.taxInvoiceInfo
      ? {
          businessNumber: String(body.taxInvoiceInfo.businessNumber ?? "").trim(),
          companyName: String(body.taxInvoiceInfo.companyName ?? "").trim(),
          representative: String(body.taxInvoiceInfo.representative ?? "").trim(),
          email: String(body.taxInvoiceInfo.email ?? "").trim().toLowerCase(),
          businessType: String(body.taxInvoiceInfo.businessType ?? "").trim() || undefined,
          businessItem: String(body.taxInvoiceInfo.businessItem ?? "").trim() || undefined,
          address: String(body.taxInvoiceInfo.address ?? "").trim() || undefined,
        }
      : undefined;

  if (receiptType === "cash_receipt" && !receiptPhone) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "현금영수증 발급을 위해 휴대폰번호가 필요합니다." } },
      { status: 400 }
    );
  }

  if (receiptType === "tax_invoice") {
    if (!taxInvoiceInfo?.businessNumber || !taxInvoiceInfo?.companyName || !taxInvoiceInfo?.representative || !taxInvoiceInfo?.email) {
      return NextResponse.json(
        { error: { code: "INVALID_BODY", message: "세금계산서 발행을 위해 사업자등록번호, 상호, 대표자명, 이메일이 필요합니다." } },
        { status: 400 }
      );
    }
  }

  const pendingOrder: PendingOrder = {
    orderId,
    email,
    type: body.type,
    supplyAmount,
    vatAmount,
    amount,
    orderName,
    status: "awaiting_deposit",
    createdAt,
    checkoutFlow: "bank_transfer",
    depositorName,
    receiptType,
    ...(receiptPhone ? { receiptPhone } : {}),
    ...(taxInvoiceInfo ? { taxInvoiceInfo } : {}),
    refundStatus: "none",
    refundAmount: 0,
    ...(planId ? { planId } : {}),
    ...(packageId ? { packageId } : {}),
  };

  await db.collection("pending_orders").doc(orderId).set(pendingOrder);

  // Fire-and-forget: confirmation email to user
  sendOrderReceivedEmail({ orderId, orderName, amount, email }).catch(() => {});

  return NextResponse.json({
    ok: true,
    orderId,
    supplyAmount,
    vatAmount,
    amount,
    orderName,
  });
}
