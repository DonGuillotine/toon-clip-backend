import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Highlight } from "@/components/comic/highlight";
import { Skeleton } from "@/components/ui/skeleton";
import { Greeting } from "@/features/account/components/greeting";
import { getAccount } from "@/features/account/server";
import { ExamplesSection } from "@/features/catalog/components/examples-section";
import { PromptComposer } from "@/features/create/components/prompt-composer";
import { DevBadge } from "@/features/dev-mode/components/dev-mode";
import { isDevMode } from "@/features/dev-mode/server";
import { ProjectsSection } from "@/features/projects/components/projects-section";

export const metadata: Metadata = { title: "Home" };

function LiveIntro() {
  return (
    <header className="flex flex-col gap-4 pt-4 md:pt-8">
      <span className="kicker">Toon Clip · Studio</span>
      <h1 className="font-display text-5xl text-balance sm:text-7xl">
        Direct a clip, <Highlight>shot by shot</Highlight>
      </h1>
      <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Pick an example, see how Magic Prompt directs its idea, then fix any shot without starting
        over.
      </p>
    </header>
  );
}

/**
 * Dev mode: the fixture-backed greeting and composer. A first visit goes to
 * the sample tour until it is finished or skipped, as before.
 */
function DevIntro() {
  const account = getAccount();
  if (!account.hasCompletedTour) redirect("/tour");
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
async function Intro() {
  return (await isDevMode()) ? <DevIntro /> : <LiveIntro />;
}

/**
 * Home: the published examples to start from, and the projects already
 * made. Both come from the API.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="mt-4 h-20 w-full max-w-2xl rounded-md md:mt-8" />}>
        <Intro />
      </Suspense>
      <ExamplesSection />
      <ProjectsSection limit={4} />
    </>
  );
}
