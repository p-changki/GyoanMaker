interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

export function createRateLimiter({ windowMs, max }: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Cleanup expired entries every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60_000).unref();

  return {
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now >= entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (entry.count >= max) {
        return false;
      }

      store.set(key, { ...entry, count: entry.count + 1 });
      return true;
    },
  };
}

/** Sign-in: 5 attempts per minute per IP */
export const signInLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
});

/** Billing confirm: 5 attempts per minute per user */
export const billingConfirmLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
});

/** Billing checkout init: 10 attempts per minute per user */
export const billingCheckoutInitLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});

/** Paylink callback: 10 attempts per minute per orderId */
export const paylinkCallbackLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});
