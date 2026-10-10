import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/features/account/components/greeting";
import { Cast } from "@/features/characters/components/cast";
import { PromptComposer } from "@/features/create/components/prompt-composer";
import { GeneratingNow } from "@/features/jobs/components/generating-now";
import { RecentStoryboards } from "@/features/storyboards/components/recent-storyboards";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <>
      <section
        aria-label="Start something"
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-4 md:gap-6 md:py-8"
      >
        <Greeting />
        {/* nuqs reads the search params, which suspends during prerender. */}
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          <PromptComposer />
        </Suspense>
      </section>

      <RecentStoryboards />

      <div className="grid items-stretch gap-4 md:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <GeneratingNow />
        </div>
        <div className="lg:col-span-7">
          <Cast />
        </div>
      </div>
    </>
  );
}
