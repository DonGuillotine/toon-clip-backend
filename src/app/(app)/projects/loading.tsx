import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-14 w-64 rounded-md" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
