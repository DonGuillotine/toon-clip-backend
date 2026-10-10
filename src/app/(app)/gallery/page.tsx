import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { GalleryView } from "@/features/gallery/components/gallery-view";

export const metadata: Metadata = { title: "Gallery" };

export default function GalleryPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
      {/* nuqs reads the search params, which suspends during prerender. */}
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <GalleryView />
      </Suspense>
    </>
  );
}
