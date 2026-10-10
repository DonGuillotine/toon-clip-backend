import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4" aria-busy="true" aria-label="Loading the board">
      <Skeleton className="h-9 w-64 rounded-full" />
      <Skeleton className="min-h-120 flex-1 rounded-xl" />
    </div>
  );
}
