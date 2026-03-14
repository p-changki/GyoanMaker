const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

function isTelegramConfigured(): boolean {
  return !!TELEGRAM_BOT_TOKEN && !!TELEGRAM_CHAT_ID;
}

async function sendTelegramMessage(text: string): Promise<void> {
  if (!isTelegramConfigured()) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured, skipping.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[telegram] sendMessage failed: ${res.status} ${body}`);
  }
}

export interface BankTransferTelegramInfo {
  buyerEmail: string;
  orderId: string;
  orderName: string;
  amount: number;
  depositorName: string;
  receiptType: "none" | "cash_receipt" | "tax_invoice";
}

export async function sendBankTransferTelegramNotification(
  info: BankTransferTelegramInfo
): Promise<void> {
  const receiptLabel =
    info.receiptType === "cash_receipt"
      ? "현금영수증"
      : info.receiptType === "tax_invoice"
        ? "세금계산서"
        : "미신청";

  const text = [
    "📥 <b>무통장입금 신청</b>",
    "",
    `신청자: ${info.buyerEmail}`,
    `입금자명: ${info.depositorName}`,
    `상품: ${info.orderName}`,
    `금액: ₩${info.amount.toLocaleString()}`,
    `증빙: ${receiptLabel}`,
    `주문번호: ${info.orderId.slice(0, 16)}`,
    "",
    `👉 <a href="https://gyoan-maker.store/admin">어드민 페이지</a>`,
  ].join("\n");

  await sendTelegramMessage(text);
}
