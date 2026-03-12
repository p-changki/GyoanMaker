export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

/**
 * Expires bank transfer orders older than 3 business days (~5 calendar days).
 * Vercel Cron triggers this daily. Also callable manually with CRON_SECRET header.
 */
const EXPIRE_AFTER_MS = 5 * 24 * 60 * 60 * 1000; // 5 calendar days ≈ 3 business days

export async function GET(req: NextRequest) {
  // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/expire-bank-orders] CRON_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - EXPIRE_AFTER_MS).toISOString();

    const snap = await db
      .collection("pending_orders")
      .where("checkoutFlow", "==", "bank_transfer")
      .where("status", "==", "awaiting_deposit")
      .where("createdAt", "<", cutoff)
      .limit(100)
      .get();

    if (snap.empty) {
      return NextResponse.json({ ok: true, expired: 0 });
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    for (const doc of snap.docs) {
      batch.update(doc.ref, {
        status: "failed",
        failedAt: now,
        errorMessage: "입금 기한 초과 (3영업일) 자동 취소",
        updatedAt: now,
      });
    }

    await batch.commit();

    return NextResponse.json({ ok: true, expired: snap.size });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[cron/expire-bank-orders] ${message}`);
    return NextResponse.json(
      { error: { code: "CRON_ERROR", message } },
      { status: 500 }
    );
  }
}
