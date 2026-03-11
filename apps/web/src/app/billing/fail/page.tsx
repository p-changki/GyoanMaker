import BillingFailClient from "./BillingFailClient";

interface BillingFailPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0];
  }

  return null;
}

export default async function BillingFailPage({ searchParams }: BillingFailPageProps) {
  const params = await searchParams;
  const code = pickSingle(params.code) ?? "UNKNOWN_ERROR";
  const message = pickSingle(params.message) ?? "Payment request failed.";
  const orderId = pickSingle(params.orderId) ?? pickSingle(params.orderNo);

  return (
    <BillingFailClient code={code} message={message} orderId={orderId} />
  );
}
