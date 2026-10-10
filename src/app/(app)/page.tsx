import { type Metadata } from "next";
import { Suspense } from "react";

import { Panel } from "@/components/manga/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/features/account/components/greeting";
import { Cast } from "@/features/characters/components/cast";
import { PromptBubble } from "@/features/create/components/prompt-bubble";
import { GeneratingNow } from "@/features/jobs/components/generating-now";
import { RecentStoryboards } from "@/features/storyboards/components/recent-storyboards";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-10">
      <Panel className="px-5 pt-6 pb-8 sm:px-8 sm:pt-8 sm:pb-10">
        <div
          aria-hidden="true"
          className="focus-lines pointer-events-none absolute inset-0 [--focus-ink:var(--tone-2)] [--focus-x:92%] [--focus-y:12%]"
        />
        <div className="relative flex flex-col gap-6">
          <Greeting />
          <Suspense fallback={<Skeleton className="h-72 rounded-bubble" />}>
            <PromptBubble />
          </Suspense>
        </div>
      </Panel>

      <RecentStoryboards />

      <div className="grid items-start gap-3 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <GeneratingNow />
        </div>
        <div className="lg:col-span-7">
          <Cast />
        </div>
      </div>
    </div>
  );
}
