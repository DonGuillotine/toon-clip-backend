import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading the sheet">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
        <Skeleton className="h-96 rounded-xl lg:col-span-5" />
        <Skeleton className="h-96 rounded-xl lg:col-span-7" />
      </div>
    </div>
  );
}
