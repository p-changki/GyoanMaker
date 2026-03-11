import BillingSuccessClient from "./BillingSuccessClient";

interface BillingSuccessPageProps {
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

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const params = await searchParams;
  const paymentKey = pickSingle(params.paymentKey);
  const orderId = pickSingle(params.orderId);
  const amountRaw = pickSingle(params.amount);
  const amount = amountRaw ? Number(amountRaw) : NaN;
  const paylinkOrderNo = pickSingle(params.orderNo);
  const paylinkStatus = pickSingle(params.payStatus) ?? pickSingle(params.status);

  return (
    <BillingSuccessClient
      paymentKey={paymentKey}
      orderId={orderId}
      amount={amount}
      paylinkOrderNo={paylinkOrderNo}
      paylinkStatus={paylinkStatus}
    />
  );
}
