import type { PlanId, PaymentMethod, TopUpPackageId } from "@gyoanmaker/shared/plans";
import { buildTossBasicAuth } from "./toss-utils";

export interface PaymentRequest {
  type: "plan" | "topup";
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

export interface TossCreatePaymentRequest {
  orderNo: string;
  amount: number;
  amountTaxFree: number;
  productDesc: string;
  retUrl: string;
  retCancelUrl: string;
  autoExecute: boolean;
  resultCallback?: string;
  callbackVersion?: "V1" | "V2";
}

export interface TossCreatePaymentResult {
  checkoutUrl: string;
  payToken: string;
  raw: unknown;
}

export interface TossPaylinkStatusRequest {
  orderNo: string;
  payToken?: string;
}

export interface TossPaylinkStatusResult {
  orderNo: string;
  amount: number;
  payStatus: string;
  payToken: string | null;
  payMethod: string | null;
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

const TOSS_PAYLINK_BASE_URL =
  process.env.TOSS_PAYLINK_BASE_URL?.trim() ?? "https://pay.toss.im/api/v2";

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
      typeof asRecord.code === "string"
        ? asRecord.code
        : typeof asRecord.code === "number"
          ? String(asRecord.code)
          : undefined,
    message:
      typeof asRecord.message === "string"
        ? asRecord.message
        : typeof asRecord.msg === "string"
          ? asRecord.msg
          : undefined,
  };
}

function requirePaylinkApiKey(): string {
  const apiKey = process.env.TOSS_PAYLINK_API_KEY?.trim();
  if (apiKey) {
    return apiKey;
  }

  throw new TossPaymentError(
    "TOSS_PAYLINK_API_KEY is not configured — paylink operation rejected (fail-closed).",
    { code: "PAYLINK_API_KEY_MISSING", statusCode: 500 }
  );
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

export async function createTossPayment(
  req: TossCreatePaymentRequest
): Promise<TossCreatePaymentResult> {
  if (req.autoExecute && !req.resultCallback) {
    throw new TossPaymentError(
      "resultCallback is required when autoExecute=true for paylink.",
      { code: "PAYLINK_RESULT_CALLBACK_MISSING", statusCode: 400 }
    );
  }

  const apiKey = requirePaylinkApiKey();
  const res = await fetch(`${TOSS_PAYLINK_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      orderNo: req.orderNo,
      amount: req.amount,
      amountTaxFree: req.amountTaxFree,
      productDesc: req.productDesc,
      retUrl: req.retUrl,
      retCancelUrl: req.retCancelUrl,
      autoExecute: req.autoExecute,
      ...(req.resultCallback ? { resultCallback: req.resultCallback } : {}),
      ...(req.callbackVersion ? { callbackVersion: req.callbackVersion } : {}),
    }),
  });

  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const parsed = parseTossErrorBody(payload);
    throw new TossPaymentError(
      parsed.message ?? "Failed to create Toss paylink payment.",
      {
        code: parsed.code,
        statusCode: res.status,
        raw: payload,
      }
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new TossPaymentError("Invalid Toss paylink create response.", {
      statusCode: res.status,
      raw: payload,
    });
  }

  const record = payload as Record<string, unknown>;
  const code = typeof record.code === "number" ? record.code : 0;
  if (code !== 0) {
    throw new TossPaymentError(
      typeof record.msg === "string"
        ? record.msg
        : "Toss paylink create response returned non-zero code.",
      {
        code: String(code),
        statusCode: 400,
        raw: payload,
      }
    );
  }

  const checkoutUrl =
    typeof record.checkoutPage === "string"
      ? record.checkoutPage
      : typeof record.checkoutUrl === "string"
        ? record.checkoutUrl
        : null;
  const payToken = typeof record.payToken === "string" ? record.payToken : null;

  if (!checkoutUrl || !payToken) {
    throw new TossPaymentError(
      "Toss paylink create response missing checkoutPage/payToken.",
      {
        statusCode: res.status,
        raw: payload,
      }
    );
  }

  return {
    checkoutUrl,
    payToken,
    raw: payload,
  };
}

export async function fetchTossPaylinkStatus(
  req: TossPaylinkStatusRequest
): Promise<TossPaylinkStatusResult> {
  const apiKey = requirePaylinkApiKey();
  const res = await fetch(`${TOSS_PAYLINK_BASE_URL}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      ...(req.payToken ? { payToken: req.payToken } : { orderNo: req.orderNo }),
    }),
  });

  const payload = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const parsed = parseTossErrorBody(payload);
    throw new TossPaymentError(
      parsed.message ?? "Failed to fetch Toss paylink status.",
      {
        code: parsed.code,
        statusCode: res.status,
        raw: payload,
      }
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new TossPaymentError("Invalid Toss paylink status response.", {
      statusCode: res.status,
      raw: payload,
    });
  }

  const record = payload as Record<string, unknown>;
  const code = typeof record.code === "number" ? record.code : 0;
  if (code !== 0) {
    throw new TossPaymentError(
      typeof record.msg === "string"
        ? record.msg
        : "Toss paylink status response returned non-zero code.",
      {
        code: String(code),
        statusCode: 400,
        raw: payload,
      }
    );
  }

  const orderNo =
    typeof record.orderNo === "string" ? record.orderNo : req.orderNo;
  const amountRaw = record.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? Number(amountRaw)
        : NaN;
  const payStatus =
    typeof record.payStatus === "string"
      ? record.payStatus
      : typeof record.status === "string"
        ? record.status
        : "UNKNOWN";

  if (!Number.isFinite(amount)) {
    throw new TossPaymentError("Toss paylink status missing amount.", {
      statusCode: res.status,
      raw: payload,
    });
  }

  return {
    orderNo,
    amount,
    payStatus,
    payToken: typeof record.payToken === "string" ? record.payToken : null,
    payMethod: typeof record.payMethod === "string" ? record.payMethod : null,
    raw: payload,
  };
}
