import { Skeleton } from "@/components/ui/skeleton";

/** Skeletons at the size of what is coming, not a spinner. */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="mx-auto h-80 w-full max-w-3xl rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
