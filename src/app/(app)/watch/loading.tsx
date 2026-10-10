import { Skeleton } from "@/components/ui/skeleton";

export default function WatchLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading the player">
      <Skeleton className="h-8 w-32 rounded-full" />
      <Skeleton className="aspect-video w-full rounded-xl" />
    </div>
  );
}
