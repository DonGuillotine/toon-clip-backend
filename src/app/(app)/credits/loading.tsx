import { Skeleton } from "@/components/ui/skeleton";

export default function CreditsLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-14 w-64 rounded-md" />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-12">
        <Skeleton className="h-48 rounded-xl lg:col-span-5" />
        <Skeleton className="h-64 rounded-xl lg:col-span-7" />
      </div>
    </div>
  );
}
