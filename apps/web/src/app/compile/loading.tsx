import { Skeleton } from "@/components/ui/Skeleton";

export default function CompileLoading() {
  return (
    <div className="flex gap-4 p-4">
      <Skeleton className="h-[600px] w-48 shrink-0" />
      <Skeleton className="h-[600px] flex-1" />
      <Skeleton className="h-[600px] w-64 shrink-0" />
    </div>
  );
}
