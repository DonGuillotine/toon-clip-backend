import { Skeleton } from "@/components/ui/skeleton";

export default function ComicsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading comic pages">
      <Skeleton className="h-8 w-48 rounded-md" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
