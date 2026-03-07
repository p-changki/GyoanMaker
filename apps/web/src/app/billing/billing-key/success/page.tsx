import BillingKeySuccessClient from "./BillingKeySuccessClient";

interface BillingKeySuccessPageProps {
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

export default async function BillingKeySuccessPage({
  searchParams,
}: BillingKeySuccessPageProps) {
  const params = await searchParams;
  const authKey = pickSingle(params.authKey);
  const customerKey = pickSingle(params.customerKey);

  return (
    <BillingKeySuccessClient authKey={authKey} customerKey={customerKey} />
  );
}
