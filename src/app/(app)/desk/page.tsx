import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { DeskView } from "@/features/desk/components/desk-view";

export const metadata: Metadata = { title: "Director's desk" };

export default function DeskPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Director&apos;s desk</h1>
        <p className="text-sm text-muted-foreground">
          Your characters, palettes, styles and pending tasks in one place.
        </p>
      </header>
      {/* nuqs reads the search params (the open editor), which suspends during prerender. */}
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <DeskView />
      </Suspense>
    </div>
  );
}
