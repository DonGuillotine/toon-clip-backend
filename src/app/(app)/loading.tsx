import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-10"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-96 rounded-none" />
      <Skeleton className="h-72 rounded-none" />
    </div>
  );
}
