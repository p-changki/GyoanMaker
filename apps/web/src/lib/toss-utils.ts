/**
 * Shared Toss Payments utilities.
 * Extracted from TossPaymentButton.tsx and payment.ts for reuse
 * across one-time payment workflows.
 */

/**
 * Deterministic customer key from email (Toss requires stable identifier).
 * Max 50 chars, prefixed with `u_`.
 */
export function createCustomerKey(email: string | null | undefined): string {
  if (!email) {
    return "user_unknown";
  }

  const normalized = email
    .toLowerCase()
    .replace(/[^a-z0-9@._=-]/g, "_")
    .slice(0, 44);

  return `u_${normalized}`;
}

/**
 * Build HTTP Basic auth header value for Toss secret key.
 * Format: `Basic base64(secretKey:)`
 */
export function buildTossBasicAuth(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

/**
 * Resolve Toss secret key from env, throwing if missing.
 */
export function requireTossSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      "TOSS_SECRET_KEY is not configured — operation rejected (fail-closed)."
    );
  }
  return secretKey;
}
