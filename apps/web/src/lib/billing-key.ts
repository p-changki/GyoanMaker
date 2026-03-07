import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "./firebase-admin";
import { buildTossBasicAuth, requireTossSecretKey } from "./toss-utils";

const COLLECTION = "users";

export interface BillingKeyInfo {
  key: string;
  customerKey: string;
  cardCompany: string;
  cardNumber: string;
  createdAt: string;
}

export interface BillingKeyPublic {
  cardCompany: string;
  cardNumber: string;
  createdAt: string;
}

interface TossIssueBillingKeyResponse {
  billingKey?: string;
  customerKey?: string;
  card?: {
    issuerCode?: string;
    number?: string;
  };
}

interface TossErrorBody {
  code?: string;
  message?: string;
}

function parseTossError(payload: unknown): TossErrorBody {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const rec = payload as Record<string, unknown>;
  return {
    code: typeof rec.code === "string" ? rec.code : undefined,
    message: typeof rec.message === "string" ? rec.message : undefined,
  };
}

export async function issueBillingKey(
  authKey: string,
  customerKey: string
): Promise<{ billingKey: string; cardCompany: string; cardNumber: string }> {
  const secretKey = requireTossSecretKey();

  const res = await fetch(
    "https://api.tosspayments.com/v1/billing/authorizations/issue",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildTossBasicAuth(secretKey),
      },
      body: JSON.stringify({ authKey, customerKey }),
    }
  );

  const payload = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const parsed = parseTossError(payload);
    throw new Error(
      parsed.message ?? "Failed to issue billing key from Toss."
    );
  }

  const data = payload as TossIssueBillingKeyResponse;

  if (!data.billingKey) {
    throw new Error("Toss response missing billingKey.");
  }

  return {
    billingKey: data.billingKey,
    cardCompany: data.card?.issuerCode ?? "UNKNOWN",
    cardNumber: data.card?.number ?? "****-****-****-****",
  };
}

export async function saveBillingKey(
  email: string,
  info: BillingKeyInfo
): Promise<void> {
  const key = email.toLowerCase();
  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set(
      {
        billingKey: {
          key: info.key,
          customerKey: info.customerKey,
          cardCompany: info.cardCompany,
          cardNumber: info.cardNumber,
          createdAt: info.createdAt,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function getBillingKey(
  email: string
): Promise<BillingKeyInfo | null> {
  const key = email.toLowerCase();
  const snap = await getDb().collection(COLLECTION).doc(key).get();
  const data = snap.data() as { billingKey?: BillingKeyInfo } | undefined;

  if (!data?.billingKey?.key) {
    return null;
  }

  return data.billingKey;
}

export async function getBillingKeyPublic(
  email: string
): Promise<BillingKeyPublic | null> {
  const info = await getBillingKey(email);
  if (!info) {
    return null;
  }

  return {
    cardCompany: info.cardCompany,
    cardNumber: info.cardNumber,
    createdAt: info.createdAt,
  };
}

export async function deleteBillingKey(email: string): Promise<void> {
  const key = email.toLowerCase();
  await getDb()
    .collection(COLLECTION)
    .doc(key)
    .set(
      {
        billingKey: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export interface ChargeBillingKeyResult {
  paymentKey: string;
  orderId: string;
  totalAmount: number;
  status: string;
  approvedAt: string | null;
}

export async function chargeBillingKey(
  billingKey: string,
  customerKey: string,
  amount: number,
  orderId: string,
  orderName: string
): Promise<ChargeBillingKeyResult> {
  const secretKey = requireTossSecretKey();

  const res = await fetch(
    `https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildTossBasicAuth(secretKey),
      },
      body: JSON.stringify({
        customerKey,
        amount,
        orderId,
        orderName,
      }),
    }
  );

  const payload = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const parsed = parseTossError(payload);
    throw new Error(
      parsed.message ?? "Failed to charge billing key."
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid Toss billing charge response.");
  }

  const rec = payload as Record<string, unknown>;

  return {
    paymentKey: typeof rec.paymentKey === "string" ? rec.paymentKey : "",
    orderId: typeof rec.orderId === "string" ? rec.orderId : orderId,
    totalAmount: typeof rec.totalAmount === "number" ? rec.totalAmount : amount,
    status: typeof rec.status === "string" ? rec.status : "UNKNOWN",
    approvedAt: typeof rec.approvedAt === "string" ? rec.approvedAt : null,
  };
}
