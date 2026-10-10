import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { WatchView } from "@/features/watch/components/watch-view";

export const metadata: Metadata = { title: "Watch" };

export default function WatchPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Watch</h1>
      {/* nuqs reads the search params, which suspends during prerender. */}
      <Suspense fallback={<Skeleton className="aspect-video w-full rounded-xl" />}>
        <WatchView />
      </Suspense>
    </>
  );
}
