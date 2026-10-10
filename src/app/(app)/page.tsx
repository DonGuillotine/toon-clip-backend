import { type Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/features/account/components/greeting";
import { getAccount } from "@/features/account/server";
import { PromptComposer } from "@/features/create/components/prompt-composer";

export const metadata: Metadata = { title: "Home" };

/**
 * Home is one thing: the composer, centred in the panel. Recent work, the
 * cast and the queue live in the shell's dock, so they are on every page.
 */
export default function HomePage() {
  // CONTRACT: once accounts come from a session, this read becomes per-request.
  const account = getAccount();

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 md:py-16">
      <section
        aria-label="Start something"
        className="flex w-full max-w-2xl flex-col items-center gap-6 text-center"
      >
        <Greeting displayName={account.displayName} />
        {/* nuqs reads the search params, which suspends during prerender. */}
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
          <div className="w-full">
            <PromptComposer />
          </div>
        </Suspense>
      </section>
    </div>
  );
}
