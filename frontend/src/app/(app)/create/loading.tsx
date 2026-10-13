import { Skeleton } from "@/components/ui/skeleton";

export default function QuickCreateLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      aria-busy="true"
      aria-label="Loading Quick create"
    >
      <Skeleton className="h-16 w-72 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
