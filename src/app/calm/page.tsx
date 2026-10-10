import { type Metadata } from "next";
import { Suspense } from "react";

import { CalmCast } from "@/calm/home/cast";
import { CalmGeneratingNow } from "@/calm/home/generating-now";
import { CalmGreeting } from "@/calm/home/greeting";
import { CalmPromptCard } from "@/calm/home/prompt-card";
import { CalmRecentStoryboards } from "@/calm/home/recent-storyboards";
import { Skeleton } from "@/components/ui/calm/skeleton";

export const metadata: Metadata = { title: "Home" };

export default function CalmHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <CalmGreeting />
        <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
          <CalmPromptCard />
        </Suspense>
      </section>

      <CalmRecentStoryboards />

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CalmGeneratingNow />
        </div>
        <div className="lg:col-span-7">
          <CalmCast />
        </div>
      </div>
    </div>
  );
}
