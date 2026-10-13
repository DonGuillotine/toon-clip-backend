import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading the gallery">
      <Skeleton className="h-8 w-32 rounded-md" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
