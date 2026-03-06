import type { PlanId, PaymentMethod, TopUpPackageId } from "@gyoanmaker/shared/plans";

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
