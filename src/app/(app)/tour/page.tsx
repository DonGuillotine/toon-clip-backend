import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { TourView } from "@/features/tour/components/tour-view";

export const metadata: Metadata = { title: "Tour" };

/** The onboarding tour (spec 7.1). Static sample content; nothing generates. */
export default function TourPage() {
  return (
    // nuqs reads the search params, which suspends during prerender.
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-xl" />}>
      <TourView />
    </Suspense>
  );
}
