import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { StoryboardList } from "@/features/storyboards/components/storyboard-list";

export const metadata: Metadata = { title: "Storyboards" };

export default function StoryboardsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Storyboards</h1>
      {/* nuqs reads the search params, which suspends during prerender. */}
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <StoryboardList />
      </Suspense>
    </>
  );
}
