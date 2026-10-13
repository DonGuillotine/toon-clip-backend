import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { AudioView } from "@/features/audio/components/audio-view";

export const metadata: Metadata = { title: "Music and voices" };

export default function AudioPage() {
  return (
    // nuqs reads the search params, which suspends during prerender.
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <AudioView />
    </Suspense>
  );
}
