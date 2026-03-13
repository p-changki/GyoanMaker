"use client";

interface QuotaModelStatus {
  limit: number;
  used: number;
  remaining: number;
  credits: number;
}

interface QuotaInfo {
  plan: "free" | "basic" | "standard" | "pro";
  flash: QuotaModelStatus;
  pro: QuotaModelStatus;
  storage: { limit: number | null; used: number; remaining: number | null };
  illustration: QuotaModelStatus;
}

interface UserQuotaCardsProps {
  quota: QuotaInfo;
}

export default function UserQuotaCards({ quota }: UserQuotaCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">속도 사용량</p>
        <p className="text-sm font-bold text-gray-700 mt-1">
          {quota.flash.used}{" "}
          <span className="text-gray-400 font-normal">/ {quota.flash.limit}</span>
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">크레딧: {quota.flash.credits}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">정밀 사용량</p>
        <p className="text-sm font-bold text-gray-700 mt-1">
          {quota.pro.used}{" "}
          <span className="text-gray-400 font-normal">/ {quota.pro.limit}</span>
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">크레딧: {quota.pro.credits}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">삽화</p>
        <p className="text-sm font-bold text-gray-700 mt-1">
          {quota.illustration.used}{" "}
          <span className="text-gray-400 font-normal">/ {quota.illustration.limit}</span>
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">크레딧: {quota.illustration.credits}</p>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">저장 슬롯</p>
        <p className="text-sm font-bold text-gray-700 mt-1">
          {quota.storage.used}{" "}
          <span className="text-gray-400 font-normal">
            / {quota.storage.limit === null ? "∞" : quota.storage.limit}
          </span>
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">요금제: {quota.plan.toUpperCase()}</p>
      </div>
    </div>
  );
}
