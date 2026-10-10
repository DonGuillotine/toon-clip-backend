import { Skeleton } from "@/components/ui/skeleton";

/** Skeletons at the size of the export panel. */
export default function ExportLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading export">
      <Skeleton className="h-16 w-72 rounded-xl" />
      <Skeleton className="h-9 w-56 rounded-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
