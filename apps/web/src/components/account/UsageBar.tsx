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
  const ratio = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const warn = ratio >= 80;

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className={`font-medium ${warn ? "text-amber-600" : "text-gray-500"}`}>
          {used}/{limit}
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full ${warn ? "bg-amber-500" : "bg-blue-500"}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {remaining} remaining (credits: {credits})
      </p>
    </div>
  );
}
