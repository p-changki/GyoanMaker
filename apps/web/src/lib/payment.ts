import type { PlanId, PaymentMethod, TopUpPackageId } from "@gyoanmaker/shared/plans";
import { buildTossBasicAuth } from "./toss-utils";

export interface PaymentRequest {
  type: "subscription" | "topup";
  planId?: PlanId;
  packageId?: TopUpPackageId;
  amount: number;
  email: string;
  idempotencyKey?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  method: PaymentMethod;
}

export interface TossConfirmResult {
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  status: string;
  method: string | null;
  approvedAt: string | null;
  raw: unknown;
}

interface TossErrorBody {
  code?: string;
  message?: string;
}

interface TossPaymentErrorOptions {
  code?: string;
  statusCode?: number;
  raw?: unknown;
}

export class TossPaymentError extends Error {
  code?: string;
  statusCode?: number;
  raw?: unknown;

  constructor(message: string, options: TossPaymentErrorOptions = {}) {
    super(message);
    this.name = "TossPaymentError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.raw = options.raw;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mockPayment(req: PaymentRequest): Promise<PaymentResult> {
  await sleep(1500);

  return {
    success: true,
    transactionId: `mock_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    amount: req.amount,
    method: "mock",
  };
}

export async function processPayment(
  req: PaymentRequest
): Promise<PaymentResult> {
  return mockPayment(req);
}



function parseTossErrorBody(payload: unknown): TossErrorBody {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const asRecord = payload as Record<string, unknown>;
  return {
    code:
      typeof asRecord.code === "string" ? asRecord.code : undefined,
    message:
      typeof asRecord.message === "string" ? asRecord.message : undefined,
  };
}

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<TossConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new TossPaymentError(
      "TOSS_SECRET_KEY is not configured — payment confirmation rejected (fail-closed).",
      { code: "SECRET_KEY_MISSING", statusCode: 500 }
    );
  }

  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: buildTossBasicAuth(secretKey),
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const parsed = parseTossErrorBody(payload);
    throw new TossPaymentError(
      parsed.message ?? "Failed to confirm payment with Toss Payments.",
      {
        code: parsed.code,
        statusCode: res.status,
        raw: payload,
      }
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new TossPaymentError("Invalid Toss confirm response.", {
      statusCode: res.status,
      raw: payload,
    });
  }

  const record = payload as Record<string, unknown>;
  const totalAmount = typeof record.totalAmount === "number" ? record.totalAmount : NaN;
  const status = typeof record.status === "string" ? record.status : "UNKNOWN";
  const method = typeof record.method === "string" ? record.method : null;
  const approvedAt = typeof record.approvedAt === "string" ? record.approvedAt : null;

  if (!Number.isFinite(totalAmount)) {
    throw new TossPaymentError("Toss response missing totalAmount.", {
      statusCode: res.status,
      raw: payload,
    });
  }

  return {
    paymentKey:
      typeof record.paymentKey === "string" ? record.paymentKey : paymentKey,
    orderId: typeof record.orderId === "string" ? record.orderId : orderId,
    totalAmount,
    status,
    method,
    approvedAt,
    raw: payload,
  };
}
