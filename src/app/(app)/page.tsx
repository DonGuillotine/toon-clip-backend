import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/features/account/components/greeting";
import { getAccount } from "@/features/account/server";
import { PromptComposer } from "@/features/create/components/prompt-composer";

export const metadata: Metadata = { title: "Home" };

/**
 * Read per request: the name can change on the profile page, and a first
 * visit goes to the tour (spec 7.1) until it is finished or skipped.
 */
async function AccountGreeting() {
  await connection();
  // CONTRACT: once accounts come from a session, this read is per user.
  const account = getAccount();
  if (!account.hasCompletedTour) redirect("/tour");
  return <Greeting displayName={account.displayName} />;
}

/**
 * Home is one thing: the composer, centred in the panel. Recent work, the
 * cast and the queue live in the shell's dock, so they are on every page.
 */
export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 md:py-16">
      <section
        aria-label="Start something"
        className="flex w-full max-w-2xl flex-col items-center gap-6 text-center"
      >
        <Suspense fallback={<Skeleton className="h-10 w-80 max-w-full rounded-md" />}>
          <AccountGreeting />
        </Suspense>
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
