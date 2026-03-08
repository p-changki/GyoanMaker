#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function includesAll(source, needles, label) {
  for (const needle of needles) {
    assert(
      source.includes(needle),
      `[${label}] missing required snippet: ${needle}`
    );
  }
}

try {
  const plans = read("packages/shared/src/plans/index.ts");
  includesAll(
    plans,
    [
      '"illu_30"',
      '"illu_60"',
      '"illu_120"',
      'type: "illustration"',
      "MODEL_DISPLAY_NAMES",
    ],
    "shared plans"
  );

  const checkoutInit = read("apps/web/src/app/api/billing/checkout/init/route.ts");
  includesAll(
    checkoutInit,
    ['"illu_30"', '"illu_60"', '"illu_120"', "isTopUpPackageId", "TOP_UP_PACKAGES"],
    "checkout init route"
  );

  const billingConfirm = read("apps/web/src/app/api/billing/confirm/route.ts");
  includesAll(
    billingConfirm,
    ["TOP_UP_PACKAGES.find", "addTopUpCredits", "selectedPackage.type"],
    "billing confirm route"
  );

  const billingWebhook = read("apps/web/src/app/api/billing/webhook/route.ts");
  includesAll(
    billingWebhook,
    ["credits.illustration", "updatedIllustration"],
    "billing webhook route"
  );

  console.log("OK: illustration top-up contract checks passed.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAILED: ${message}`);
  process.exit(1);
}
