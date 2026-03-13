import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER ?? "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD ?? "";
const SUPPORT_EMAIL = "dnsxj12345aa@gmail.com";
const SERVICE_NAME = "GyoanMaker";
const SERVICE_URL = "https://gyoan-maker.store";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

function isEmailConfigured(): boolean {
  return !!GMAIL_USER && !!GMAIL_APP_PASSWORD;
}

interface OrderEmailInfo {
  orderId: string;
  orderName: string;
  amount: number;
  email: string;
}

// ── Shared HTML wrapper ──

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
    <div style="padding:24px 28px 16px;border-bottom:1px solid #f0f0f0;">
      <h1 style="margin:0;font-size:18px;color:#111;">${SERVICE_NAME}</h1>
    </div>
    <div style="padding:24px 28px 32px;">${body}</div>
    <div style="padding:16px 28px;background:#fafafa;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#999;">
        문의: <a href="mailto:${SUPPORT_EMAIL}" style="color:#666;">${SUPPORT_EMAIL}</a>
        &nbsp;|&nbsp;
        <a href="${SERVICE_URL}" style="color:#666;">${SERVICE_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Approved email ──

export async function sendOrderApprovedEmail(info: OrderEmailInfo): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] Gmail credentials not configured, skipping approved email.");
    return;
  }

  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;font-size:16px;color:#111;">결제 확인 및 서비스 적용 완료</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">
      입금이 확인되어 서비스가 정상 적용되었습니다.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;width:100px;">주문번호</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-family:monospace;">${info.orderId.slice(0, 16)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">상품</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${info.orderName}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">결제 금액</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-weight:600;">₩${info.amount.toLocaleString()}</td>
      </tr>
    </table>
    <div style="padding:14px 16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#166534;">서비스가 즉시 적용되었습니다. 지금 바로 이용하실 수 있습니다.</p>
    </div>
    <div style="padding:14px 16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1e40af;">청약철회 안내</p>
      <p style="margin:0;font-size:12px;color:#3b82f6;line-height:1.5;">
        서비스 이용 개시 전 7일 이내 청약철회(환불) 가능합니다.<br/>
        환불 신청: <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;">${SUPPORT_EMAIL}</a>
      </p>
    </div>
  `);

  try {
    await getTransporter().sendMail({
      from: `${SERVICE_NAME} <${GMAIL_USER}>`,
      to: info.email,
      subject: `[${SERVICE_NAME}] 결제 확인 및 서비스 적용 완료`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send approved email:", error);
  }
}

// ── Rejected email ──

export async function sendOrderRejectedEmail(
  info: OrderEmailInfo,
  reason?: string
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] Gmail credentials not configured, skipping rejected email.");
    return;
  }

  const reasonText = reason
    ? `<p style="margin:8px 0 0;font-size:13px;color:#dc2626;">사유: ${escapeHtml(reason)}</p>`
    : "";

  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;font-size:16px;color:#111;">입금 신청 처리 안내</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">
      아래 주문 건이 처리되지 않았습니다.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;width:100px;">주문번호</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-family:monospace;">${info.orderId.slice(0, 16)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">상품</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${info.orderName}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">금액</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">₩${info.amount.toLocaleString()}</td>
      </tr>
    </table>
    <div style="padding:14px 16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#991b1b;">입금 확인이 되지 않아 주문이 취소되었습니다.</p>
      ${reasonText}
    </div>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.5;">
      다시 신청하시려면 <a href="${SERVICE_URL}/billing?tab=bank" style="color:#2563eb;">무통장입금 페이지</a>를 이용해주세요.<br/>
      문의: <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;">${SUPPORT_EMAIL}</a>
    </p>
  `);

  try {
    await getTransporter().sendMail({
      from: `${SERVICE_NAME} <${GMAIL_USER}>`,
      to: info.email,
      subject: `[${SERVICE_NAME}] 입금 신청 처리 안내`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send rejected email:", error);
  }
}

// ── Admin purchase notification ──

interface AdminPurchaseNotificationInfo {
  buyerEmail: string;
  orderId: string;
  orderName: string;
  amount: number;
  orderType: "plan" | "topup";
}

export async function sendAdminPurchaseNotificationEmail(
  info: AdminPurchaseNotificationInfo
): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!isEmailConfigured() || adminEmails.length === 0) {
    console.warn("[email] Admin emails not configured, skipping admin notification.");
    return;
  }

  const typeLabel = info.orderType === "plan" ? "요금제" : "크레딧 팩";
  const adminUrl = `${SERVICE_URL}/admin`;

  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;font-size:16px;color:#111;">🎉 새 결제가 완료되었습니다</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;width:100px;">구매자</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${escapeHtml(info.buyerEmail)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">구분</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${typeLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">상품</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${escapeHtml(info.orderName)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">결제 금액</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-weight:600;">₩${info.amount.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">주문번호</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-family:monospace;">${escapeHtml(info.orderId.slice(0, 16))}</td>
      </tr>
    </table>
    <a href="${adminUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">어드민 페이지 바로가기</a>
  `);

  try {
    await getTransporter().sendMail({
      from: `${SERVICE_NAME} <${GMAIL_USER}>`,
      to: adminEmails.join(","),
      subject: `[${SERVICE_NAME}] 새 결제 알림 — ${escapeHtml(info.orderName)} (₩${info.amount.toLocaleString()})`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send admin purchase notification:", error);
  }
}

// ── Admin bank transfer request notification ──

interface AdminBankTransferNotificationInfo {
  buyerEmail: string;
  orderId: string;
  orderName: string;
  amount: number;
  depositorName: string;
  receiptType: "none" | "cash_receipt" | "tax_invoice";
  receiptPhone?: string;
  taxInvoiceInfo?: {
    businessNumber?: string;
    companyName?: string;
    representative?: string;
    email?: string;
  };
}

export async function sendAdminBankTransferNotificationEmail(
  info: AdminBankTransferNotificationInfo
): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!isEmailConfigured() || adminEmails.length === 0) {
    console.warn("[email] Admin emails not configured, skipping bank transfer notification.");
    return;
  }

  const receiptTypeLabel =
    info.receiptType === "cash_receipt"
      ? `현금영수증 (${escapeHtml(info.receiptPhone ?? "-")})`
      : info.receiptType === "tax_invoice"
        ? `세금계산서 (${escapeHtml(info.taxInvoiceInfo?.companyName ?? "-")} / ${escapeHtml(info.taxInvoiceInfo?.businessNumber ?? "-")})`
        : "미신청";

  const adminUrl = `${SERVICE_URL}/admin`;

  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;font-size:16px;color:#111;">📥 무통장입금 신청이 접수되었습니다</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;width:120px;">신청자</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${escapeHtml(info.buyerEmail)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">입금자명</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${escapeHtml(info.depositorName)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">상품</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${escapeHtml(info.orderName)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">입금 금액</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-weight:600;">₩${info.amount.toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">증빙 신청</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${receiptTypeLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">주문번호</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-family:monospace;">${escapeHtml(info.orderId.slice(0, 16))}</td>
      </tr>
    </table>
    <a href="${adminUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">어드민 페이지 바로가기</a>
  `);

  try {
    await getTransporter().sendMail({
      from: `${SERVICE_NAME} <${GMAIL_USER}>`,
      to: adminEmails.join(","),
      subject: `[${SERVICE_NAME}] 무통장입금 신청 — ${escapeHtml(info.orderName)} (₩${info.amount.toLocaleString()})`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send admin bank transfer notification:", error);
  }
}

// ── Order received (deposit request submitted) ──

export async function sendOrderReceivedEmail(info: OrderEmailInfo): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] Gmail credentials not configured, skipping received email.");
    return;
  }

  const html = wrapHtml(`
    <h2 style="margin:0 0 16px;font-size:16px;color:#111;">입금 신청이 접수되었습니다</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6;">
      아래 정보를 확인하시고, 계좌로 정확한 금액을 입금해주세요.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;width:100px;">주문번호</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-family:monospace;">${info.orderId.slice(0, 16)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">상품</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;">${info.orderName}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px;background:#f9f9f9;color:#666;border:1px solid #eee;">입금 금액</td>
        <td style="padding:10px 12px;border:1px solid #eee;color:#111;font-weight:600;">₩${info.amount.toLocaleString()}</td>
      </tr>
    </table>
    <div style="padding:14px 16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">입금 계좌</p>
      <p style="margin:0;font-size:14px;color:#111;line-height:1.6;">
        토스뱅크 <strong>1002-4752-1132</strong><br/>
        예금주: 박창기
      </p>
    </div>
    <div style="padding:14px 16px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
        주문일로부터 <strong>3영업일 이내</strong> 미입금 시 자동 취소됩니다.<br/>
        입금 확인 후 영업일 1~2일 내 서비스가 적용되며, 완료 시 이메일로 안내드립니다.
      </p>
    </div>
  `);

  try {
    await getTransporter().sendMail({
      from: `${SERVICE_NAME} <${GMAIL_USER}>`,
      to: info.email,
      subject: `[${SERVICE_NAME}] 입금 신청 접수 안내`,
      html,
    });
  } catch (error) {
    console.error("[email] Failed to send received email:", error);
  }
}
