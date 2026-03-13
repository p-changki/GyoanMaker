"use client";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
  alert?: boolean;
  onClick?: () => void;
}

export default function StatCard({ label, value, sub, accent, alert, onClick }: StatCardProps) {
  const borderClass = alert
    ? "border-red-200 bg-red-50"
    : accent
      ? "border-violet-200 bg-violet-50"
      : "border-gray-200/60 bg-white";

  const valueClass = alert ? "text-red-600" : accent ? "text-violet-700" : "text-gray-900";

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 shadow-sm border ${borderClass} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      {onClick && <p className="text-[10px] text-gray-400 mt-1">클릭하여 상세 보기 →</p>}
    </div>
  );
}
