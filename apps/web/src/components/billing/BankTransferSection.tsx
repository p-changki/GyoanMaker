"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PLANS,
  TOP_UP_PACKAGES,
  toVatInclusiveAmount,
  type PlanId,
  type TopUpPackageId,
} from "@gyoanmaker/shared/plans";

type ProductValue = `plan:${PlanId}` | `topup:${TopUpPackageId}`;

interface ProductOption {
  value: ProductValue;
  label: string;
  price: number;
  totalAmount: number;
}

const PLAN_OPTIONS: ProductOption[] = (
  ["basic", "standard", "pro"] as const
).map((planId) => {
  const plan = PLANS[planId];
  const vat = toVatInclusiveAmount(plan.price);
  return {
    value: `plan:${planId}`,
    label: `${planId.toUpperCase()} 이용권`,
    price: plan.price,
    totalAmount: vat.totalAmount,
  };
});

const TOPUP_OPTIONS: ProductOption[] = TOP_UP_PACKAGES.map((pkg) => {
  const vat = toVatInclusiveAmount(pkg.price);
  return {
    value: `topup:${pkg.id}`,
    label: pkg.label,
    price: pkg.price,
    totalAmount: vat.totalAmount,
  };
});

const ALL_OPTIONS = [...PLAN_OPTIONS, ...TOPUP_OPTIONS];

function parseProductValue(value: string): {
  type: "plan" | "topup";
  planId?: PlanId;
  packageId?: TopUpPackageId;
} | null {
  if (value.startsWith("plan:")) {
    return { type: "plan", planId: value.slice(5) as PlanId };
  }
  if (value.startsWith("topup:")) {
    return { type: "topup", packageId: value.slice(6) as TopUpPackageId };
  }
  return null;
}

export default function BankTransferSection() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [depositorName, setDepositorName] = useState("");
  const [receiptType, setReceiptType] = useState<"none" | "cash_receipt" | "tax_invoice">("none");
  const [receiptPhone, setReceiptPhone] = useState("");
  const [taxInfo, setTaxInfo] = useState({
    businessNumber: "",
    companyName: "",
    representative: "",
    email: "",
    businessType: "",
    businessItem: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    orderId?: string;
    amount?: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleCopyAccount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("토스뱅크 1002-4752-1132");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, []);

  const selected = ALL_OPTIONS.find((o) => o.value === selectedProduct);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    const parsed = parseProductValue(selectedProduct);
    if (!parsed || !depositorName.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/billing/bank-transfer/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: parsed.type,
          planId: parsed.planId,
          packageId: parsed.packageId,
          depositorName: depositorName.trim(),
          receiptType,
          ...(receiptType === "cash_receipt" ? { receiptPhone } : {}),
          ...(receiptType === "tax_invoice" ? { taxInvoiceInfo: taxInfo } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          ok: false,
          message: data?.error?.message ?? "신청에 실패했습니다.",
        });
        return;
      }

      setResult({
        ok: true,
        message: "입금 신청이 완료되었습니다. 입금 확인 후 영업일 1~2일 내 서비스가 적용됩니다.",
        orderId: data.orderId,
        amount: data.amount,
      });
      setSelectedProduct("");
      setDepositorName("");
      setReceiptType("none");
      setReceiptPhone("");
      setTaxInfo({ businessNumber: "", companyName: "", representative: "", email: "", businessType: "", businessItem: "", address: "" });
    } catch {
      setResult({ ok: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReceiptValid =
    receiptType === "none" ||
    (receiptType === "cash_receipt" && !!receiptPhone.trim()) ||
    (receiptType === "tax_invoice" &&
      !!taxInfo.businessNumber.trim() &&
      !!taxInfo.companyName.trim() &&
      !!taxInfo.representative.trim() &&
      !!taxInfo.email.trim());

  const canSubmit = !!selectedProduct && !!depositorName.trim() && isReceiptValid && !isSubmitting;

  return (
    <div className="space-y-5">
      {/* Request form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-bold text-gray-900">입금 신청</h3>

        {/* Product select — custom dropdown */}
        <div className="mt-4" ref={dropdownRef}>
          <p className="text-sm font-semibold text-gray-700">상품 선택</p>
          <div className="relative mt-1.5">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-2.5 text-sm transition-colors ${
                dropdownOpen
                  ? "border-gray-900 ring-1 ring-gray-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className={selected ? "text-gray-900" : "text-gray-400"}>
                {selected ? selected.label : "선택하세요"}
              </span>
              <div className="flex items-center gap-2">
                {selected && (
                  <span className="text-sm font-bold text-gray-900">
                    ₩{selected.totalAmount.toLocaleString()}
                  </span>
                )}
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {/* Plan group */}
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  이용권 (30일)
                </p>
                {PLAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(opt.value);
                      setDropdownOpen(false);
                      setResult(null);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                      selectedProduct === opt.value ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-700"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-semibold text-gray-900">₩{opt.totalAmount.toLocaleString()}</span>
                  </button>
                ))}

                {/* Divider */}
                <div className="mx-4 border-t border-gray-100" />

                {/* Topup group */}
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  크레딧 충전 (90일)
                </p>
                {TOPUP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(opt.value);
                      setDropdownOpen(false);
                      setResult(null);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                      selectedProduct === opt.value ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-700"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="font-semibold text-gray-900">₩{opt.totalAmount.toLocaleString()}</span>
                  </button>
                ))}
                <div className="h-1" />
              </div>
            )}
          </div>
        </div>

        {/* Selected amount display */}
        {selected && (
          <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{selected.label}</span>
              <span className="text-lg font-bold text-gray-900">
                ₩{selected.totalAmount.toLocaleString()}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              공급가 ₩{selected.price.toLocaleString()} + VAT ₩
              {(selected.totalAmount - selected.price).toLocaleString()}
            </p>
          </div>
        )}

        {/* Depositor name */}
        <div className="mt-4">
          <label htmlFor="depositor-name" className="text-sm font-semibold text-gray-700">
            입금자명
          </label>
          <input
            id="depositor-name"
            type="text"
            value={depositorName}
            onChange={(e) => {
              setDepositorName(e.target.value);
              setResult(null);
            }}
            placeholder="실제 입금 시 사용할 이름"
            maxLength={30}
            className="mt-1.5 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Receipt type selection */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700">증빙 서류</p>
          <div className="mt-2 flex gap-3">
            {([
              { value: "none", label: "필요 없음" },
              { value: "cash_receipt", label: "현금영수증" },
              { value: "tax_invoice", label: "세금계산서" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setReceiptType(opt.value);
                  setResult(null);
                }}
                className={`rounded-xl border px-4 py-2 text-sm transition-colors ${
                  receiptType === opt.value
                    ? "border-gray-900 bg-gray-900 font-semibold text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Cash receipt — phone input */}
          {receiptType === "cash_receipt" && (
            <div className="mt-3">
              <label htmlFor="receipt-phone" className="text-sm text-gray-600">
                휴대폰번호 (현금영수증 발급용)
              </label>
              <input
                id="receipt-phone"
                type="tel"
                value={receiptPhone}
                onChange={(e) => setReceiptPhone(e.target.value)}
                placeholder="010-0000-0000"
                maxLength={20}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Tax invoice — business info */}
          {receiptType === "tax_invoice" && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label htmlFor="biz-number" className="text-sm text-gray-600">
                  사업자등록번호
                </label>
                <input
                  id="biz-number"
                  type="text"
                  value={taxInfo.businessNumber}
                  onChange={(e) =>
                    setTaxInfo({ ...taxInfo, businessNumber: e.target.value })
                  }
                  placeholder="000-00-00000"
                  maxLength={20}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="biz-name" className="text-sm text-gray-600">
                  상호
                </label>
                <input
                  id="biz-name"
                  type="text"
                  value={taxInfo.companyName}
                  onChange={(e) =>
                    setTaxInfo({ ...taxInfo, companyName: e.target.value })
                  }
                  placeholder="회사명"
                  maxLength={50}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="biz-rep" className="text-sm text-gray-600">
                  대표자명
                </label>
                <input
                  id="biz-rep"
                  type="text"
                  value={taxInfo.representative}
                  onChange={(e) =>
                    setTaxInfo({ ...taxInfo, representative: e.target.value })
                  }
                  placeholder="홍길동"
                  maxLength={30}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="biz-email" className="text-sm text-gray-600">
                  세금계산서 수신 이메일
                </label>
                <input
                  id="biz-email"
                  type="email"
                  value={taxInfo.email}
                  onChange={(e) =>
                    setTaxInfo({ ...taxInfo, email: e.target.value })
                  }
                  placeholder="billing@example.com"
                  maxLength={100}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="mb-2 text-xs font-medium text-gray-400">선택 입력</p>
                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="biz-type" className="text-sm text-gray-600">
                      업태
                    </label>
                    <input
                      id="biz-type"
                      type="text"
                      value={taxInfo.businessType}
                      onChange={(e) =>
                        setTaxInfo({ ...taxInfo, businessType: e.target.value })
                      }
                      placeholder="서비스업"
                      maxLength={50}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="biz-item" className="text-sm text-gray-600">
                      종목
                    </label>
                    <input
                      id="biz-item"
                      type="text"
                      value={taxInfo.businessItem}
                      onChange={(e) =>
                        setTaxInfo({ ...taxInfo, businessItem: e.target.value })
                      }
                      placeholder="소프트웨어 개발"
                      maxLength={50}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="biz-address" className="text-sm text-gray-600">
                      사업장 주소
                    </label>
                    <input
                      id="biz-address"
                      type="text"
                      value={taxInfo.address}
                      onChange={(e) =>
                        setTaxInfo({ ...taxInfo, address: e.target.value })
                      }
                      placeholder="서울시 강남구..."
                      maxLength={200}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bank account info */}
        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">은행</dt>
              <dd className="font-semibold text-gray-900">토스뱅크</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">계좌번호</dt>
              <dd className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">1002-4752-1132</span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  {copied ? "복사됨!" : "복사"}
                </button>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">예금주</dt>
              <dd className="font-semibold text-gray-900">박창기</dd>
            </div>
          </dl>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-4 w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "신청 중..." : "입금 신청하기"}
        </button>

        {/* Result message */}
        {result && (
          <div
            className={`mt-3 rounded-xl p-3 text-sm ${
              result.ok
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="font-medium">{result.message}</p>
            {result.ok && result.amount && (
              <p className="mt-1 text-xs">
                입금 금액: ₩{result.amount.toLocaleString()} · 주문번호: {result.orderId?.slice(0, 12)}
              </p>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          신청 후 위 계좌로 정확한 금액을 입금해주세요. 입금 확인 후 영업일 1~2일 내 서비스가 적용됩니다.
        </p>
      </div>

      {/* My bank transfer orders */}
      <MyBankTransferOrders key={result?.orderId ?? "init"} />

      {/* Processing policy */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-bold text-gray-900">처리 정책</h3>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-gray-700">입금 유효 기한</dt>
            <dd className="mt-0.5 text-gray-600">
              주문일로부터 <strong>3영업일 이내</strong> 미입금 시 자동 취소됩니다.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">서비스 적용 시점</dt>
            <dd className="mt-0.5 text-gray-600">
              입금 확인 후 <strong>영업일 기준 1~2일 이내</strong> 수동 적용됩니다.
              주말·공휴일에는 확인이 지연될 수 있습니다.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">입금 확인 통지</dt>
            <dd className="mt-0.5 text-gray-600">
              입금 확인 및 서비스 적용 완료 시 가입 이메일로 안내드립니다.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-700">부분/초과 입금</dt>
            <dd className="mt-0.5 text-gray-600">
              금액이 정확하지 않을 경우 처리가 지연될 수 있습니다.
              초과 입금분은 확인 후 환불 처리됩니다.
            </dd>
          </div>
        </dl>
      </div>

      {/* Refund & withdrawal */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6">
        <h3 className="text-sm font-bold text-blue-700">청약철회 및 환불 안내</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-gray-700">
          <li>
            서비스 이용 개시 전 <strong>7일 이내</strong> 청약철회(환불) 가능
          </li>
          <li>
            서비스가 이미 적용(이용 개시)된 경우, 전자상거래법 제17조에 따라 청약철회가
            제한될 수 있습니다.
          </li>
          <li>
            환불 신청:{" "}
            <a
              href="mailto:dnsxj12345aa@gmail.com"
              className="font-medium text-blue-600 hover:underline"
            >
              dnsxj12345aa@gmail.com
            </a>
            으로 주문 정보와 환불 사유를 보내주세요.
          </li>
          <li>
            환불은 신청일로부터 <strong>3영업일 이내</strong> 원래 입금 계좌로 처리됩니다.
          </li>
        </ul>
      </div>

      {/* Cash receipt & tax invoice */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-base font-bold text-gray-900">현금영수증 / 세금계산서</h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-gray-600">
          <li>
            <strong>현금영수증</strong>: 10만원 이상 거래 시 자동 발급됩니다.
            발급을 원하시면 이메일에 휴대폰번호를 함께 기재해주세요.
          </li>
          <li>
            <strong>세금계산서</strong>: 사업자 거래 시 발행 가능합니다.
            사업자등록번호, 상호, 대표자명, 이메일을 함께 기재해주세요.
          </li>
          <li>
            VAT(부가가치세)는 별도이며, 결제 금액에 포함되어 있지 않습니다.
          </li>
        </ul>
      </div>

      {/* Contact */}
      <div className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500">
        문의:{" "}
        <a
          href="mailto:dnsxj12345aa@gmail.com"
          className="font-medium text-gray-700 hover:underline"
        >
          dnsxj12345aa@gmail.com
        </a>
      </div>
    </div>
  );
}

// ── My Bank Transfer Orders ──

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  awaiting_deposit: { text: "입금 대기", color: "bg-purple-50 text-purple-600 border-purple-200" },
  confirmed: { text: "완료", color: "bg-green-50 text-green-600 border-green-200" },
  failed: { text: "취소/거절", color: "bg-red-50 text-red-600 border-red-200" },
  pending: { text: "처리 중", color: "bg-amber-50 text-amber-600 border-amber-200" },
  paid_not_applied: { text: "적용 대기", color: "bg-orange-50 text-orange-600 border-orange-200" },
};

interface BankOrder {
  orderId: string;
  orderName: string;
  amount: number;
  status: string;
  createdAt: string;
  checkoutFlow: string | null;
}

function MyBankTransferOrders() {
  const [orders, setOrders] = useState<BankOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/orders?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      const bankOrders = (data.orders ?? []).filter(
        (o: BankOrder) => o.checkoutFlow === "bank_transfer"
      );
      setOrders(bankOrders);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async (orderId: string) => {
    if (!confirm("입금 신청을 취소하시겠습니까?")) return;
    setCancellingId(orderId);
    try {
      const res = await fetch("/api/billing/bank-transfer/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error?.message ?? "취소에 실패했습니다.");
        return;
      }
      await fetchOrders();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return null;
  if (orders.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-base font-bold text-gray-900">내 입금 신청 내역</h3>
      <div className="mt-3 space-y-2">
        {orders.map((order) => {
          const badge = STATUS_LABEL[order.status] ?? {
            text: order.status,
            color: "bg-gray-50 text-gray-500 border-gray-200",
          };
          return (
            <div
              key={order.orderId}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {order.orderName}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}
                  >
                    {badge.text}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>₩{order.amount.toLocaleString()}</span>
                  <span>·</span>
                  <span>{new Date(order.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
              </div>
              {order.status === "awaiting_deposit" && (
                <button
                  type="button"
                  onClick={() => handleCancel(order.orderId)}
                  disabled={cancellingId === order.orderId}
                  className="ml-3 shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {cancellingId === order.orderId ? "취소 중..." : "취소"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
