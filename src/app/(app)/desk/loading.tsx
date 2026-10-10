import { Skeleton } from "@/components/ui/skeleton";

export default function DeskLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading the desk">
      <Skeleton className="h-14 w-72 rounded-md" />
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
