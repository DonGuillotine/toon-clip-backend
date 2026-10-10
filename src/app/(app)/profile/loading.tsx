import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div
      className="flex flex-col gap-4 md:gap-8"
      aria-busy="true"
      aria-label="Loading your profile"
    >
      <Skeleton className="h-14 w-72 rounded-md" />
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-12">
        <Skeleton className="h-72 rounded-xl lg:col-span-7" />
        <Skeleton className="h-72 rounded-xl lg:col-span-5" />
        <Skeleton className="h-96 rounded-xl lg:col-span-7" />
        <Skeleton className="h-96 rounded-xl lg:col-span-5" />
      </div>
    </div>
  );
}
