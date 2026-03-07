interface ProgressBarProps {
  completed: number;
  total: number;
  className?: string;
}

export default function ProgressBar({
  completed,
  total,
  className = "",
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs font-medium text-gray-500">
        <span>Generation Progress</span>
        <span>{percentage}% ({completed}/{total})</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
