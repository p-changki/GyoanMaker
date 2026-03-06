import { getDb } from "../src/lib/firebase-admin";
import { getMonthKeyKst, getNowIso, PLANS } from "../src/lib/plans";
import { DEFAULT_QUOTA } from "../src/lib/quota";

interface LegacyUserDoc {
  quota?: {
    dailyLimit?: number;
    monthlyLimit?: number;
    storageLimit?: number | null;
    storageUsed?: number;
    flash?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
    pro?: {
      monthlyLimit?: number;
      used?: number;
      monthKeyKst?: string;
    };
  };
  usage?: {
    monthly?: {
      key?: string;
      count?: number;
    };
  };
  plan?: {
    tier?: "free" | "basic" | "standard" | "pro";
    status?: "active" | "past_due" | "canceled";
    currentPeriodStartAt?: string;
    currentPeriodEndAt?: string | null;
    paymentMethod?: "mock" | "toss" | null;
  };
  credits?: {
    flash?: unknown[];
    pro?: unknown[];
  };
}

function toInt(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

async function run(): Promise<void> {
  const monthKeyKst = getMonthKeyKst();
  const nowIso = getNowIso();
  const usersRef = getDb().collection("users");
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log("[migrate-quota-to-v2] no users found");
    return;
  }

  let batch = getDb().batch();
  let batchCount = 0;
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = (doc.data() ?? {}) as LegacyUserDoc;
    const planTier = data.plan?.tier ?? "free";
    const planDefaults = PLANS[planTier] ?? PLANS.free;

    const legacyMonthlyUsage =
      data.usage?.monthly?.key === monthKeyKst
        ? toInt(data.usage?.monthly?.count, 0)
        : 0;

    const flashLimit = Math.max(
      planDefaults.flashLimit,
      toInt(data.quota?.flash?.monthlyLimit, 0) ||
        toInt(data.quota?.monthlyLimit, planDefaults.flashLimit)
    );
    const proLimit = Math.max(
      planDefaults.proLimit,
      toInt(data.quota?.pro?.monthlyLimit, 0) ||
        toInt(data.quota?.monthlyLimit, planDefaults.proLimit)
    );

    const patch = {
      plan: {
        tier: planTier,
        status: data.plan?.status ?? "active",
        currentPeriodStartAt: data.plan?.currentPeriodStartAt ?? nowIso,
        currentPeriodEndAt:
          data.plan?.currentPeriodEndAt === undefined
            ? null
            : data.plan.currentPeriodEndAt,
        paymentMethod:
          data.plan?.paymentMethod === "mock" || data.plan?.paymentMethod === "toss"
            ? data.plan.paymentMethod
            : null,
      },
      quota: {
        // legacy fields keep
        dailyLimit: toInt(data.quota?.dailyLimit, DEFAULT_QUOTA.dailyLimit),
        monthlyLimit: toInt(
          data.quota?.monthlyLimit,
          DEFAULT_QUOTA.monthlyLimit
        ),
        flash: {
          monthlyLimit: flashLimit,
          used: Math.min(
            flashLimit,
            toInt(data.quota?.flash?.used, legacyMonthlyUsage)
          ),
          monthKeyKst,
        },
        pro: {
          monthlyLimit: proLimit,
          used: Math.min(proLimit, toInt(data.quota?.pro?.used, 0)),
          monthKeyKst,
        },
        storageLimit:
          data.quota?.storageLimit === null
            ? null
            : toInt(data.quota?.storageLimit, planDefaults.storageLimit ?? 0),
        storageUsed: toInt(data.quota?.storageUsed, 0),
      },
      credits: {
        flash: Array.isArray(data.credits?.flash) ? data.credits?.flash : [],
        pro: Array.isArray(data.credits?.pro) ? data.credits?.pro : [],
      },
      updatedAt: nowIso,
    };

    batch.set(doc.ref, patch, { merge: true });
    batchCount += 1;
    migrated += 1;

    if (batchCount >= 400) {
      await batch.commit();
      batch = getDb().batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }
  console.log(
    `[migrate-quota-to-v2] migrated ${migrated} user docs (monthKeyKst=${monthKeyKst})`
  );
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[migrate-quota-to-v2] failed: ${message}`);
  process.exitCode = 1;
});
