import { Skeleton } from "@/components/ui/skeleton";

export default function TourLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-4"
      aria-busy="true"
      aria-label="Loading the tour"
    >
      <Skeleton className="h-7 w-80 rounded-md" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
