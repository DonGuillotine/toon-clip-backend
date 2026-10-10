import { Skeleton } from "@/components/ui/calm/skeleton";

export default function CalmLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-10"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="mx-auto h-72 w-full max-w-3xl rounded-card" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}
