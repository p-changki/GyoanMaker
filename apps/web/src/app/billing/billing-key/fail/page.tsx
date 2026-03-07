import Link from "next/link";

interface BillingKeyFailPageProps {
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

export default async function BillingKeyFailPage({
  searchParams,
}: BillingKeyFailPageProps) {
  const params = await searchParams;
  const code = pickSingle(params.code) ?? "UNKNOWN_ERROR";
  const message = pickSingle(params.message) ?? "Card registration failed.";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        Card Registration Failed
      </h1>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      <p className="mt-1 text-xs text-gray-400">Error code: {code}</p>

      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/account"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Account
        </Link>
      </div>
    </main>
  );
}
