"use client";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  remaining: number;
  credits: number;
}

export default function UsageBar({
  label,
  used,
  limit,
  remaining,
  credits,
}: UsageBarProps) {
  const effectiveTotal = limit + credits;
  const ratio =
    effectiveTotal > 0
      ? Math.min(100, Math.round((used / effectiveTotal) * 100))
      : 0;
  const warn = remaining <= 0 || (effectiveTotal > 0 && remaining / effectiveTotal <= 0.2);

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className={`font-medium ${warn ? "text-amber-600" : "text-gray-500"}`}>
          {remaining}/{effectiveTotal}
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full ${warn ? "bg-amber-500" : "bg-blue-500"}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {remaining}회 남음{credits > 0 ? ` (기본 ${limit - used} + 크레딧 ${credits})` : ""}
      </p>
    </div>
  );
}
