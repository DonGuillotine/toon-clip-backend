import { type Metadata } from "next";
import { Suspense } from "react";

import { Landing } from "@/components/home/landing";
import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/features/account/components/greeting";
import { getAccount } from "@/features/account/server";
import { ExamplesSection } from "@/features/catalog/components/examples-section";
import { PromptComposer } from "@/features/create/components/prompt-composer";
import { DevBadge } from "@/features/dev-mode/components/dev-mode";
import { isDevMode } from "@/features/dev-mode/server";
import { ProjectsSection } from "@/features/projects/components/projects-section";

export const metadata: Metadata = { title: "Home" };

/** Dev mode: the fixture-backed greeting and composer, under the welcome. */
function DevComposer() {
  const account = getAccount();
  return (
    <section
      aria-label="Start something"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-8 text-center md:py-12"
    >
      <DevBadge />
      <Greeting displayName={account.displayName} />
      {/* nuqs reads the search params, which suspends during prerender. */}
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
        <div className="w-full">
          <PromptComposer />
        </div>
      </Suspense>
    </section>
  );
}

/** Read per request: dev mode is a cookie. */
async function DevExtras() {
  return (await isDevMode()) ? <DevComposer /> : null;
}

/**
 * Home: the welcome and the way into the tour, then the published examples
 * and the projects already made. The examples and projects come from the API.
 */
export default function HomePage() {
  return (
    <>
      <Landing />
      <Suspense fallback={null}>
        <DevExtras />
      </Suspense>
      <div id="examples" className="scroll-mt-24">
        <ExamplesSection />
      </div>
      <ProjectsSection limit={4} />
    </>
  );
}
