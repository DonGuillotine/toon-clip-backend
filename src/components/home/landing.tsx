import { ArrowRight, Download, Scissors, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { StartHere } from "@/features/catalog/components/start-here";

/**
 * Home's welcome (Flow Mockup v2, screen 1): what Toon Clip is, a way into
 * the tour, how it works, and what you leave with. Copy only promises what
 * the live API does: examples, Magic Prompt, cutting and revising, MP4.
 */
export function Landing() {
  return (
    <>
      <section
        aria-labelledby="hero-heading"
        className="mt-4 grid items-start gap-10 md:mt-8 lg:grid-cols-12 lg:gap-14"
      >
        <div className="flex flex-col gap-5 lg:col-span-6 lg:mt-3">
          <span className="kicker">Toon Clip · Studio</span>
          <h1
            id="hero-heading"
            className="font-display text-7xl leading-none text-balance sm:text-8xl xl:text-9xl"
          >
            AI for creatives
          </h1>
          <p className="text-2xl font-bold sm:text-3xl">Create your next best series now.</p>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Turn an idea and a character sheet into an animated short. Cut it anywhere, fix the part
            you do not like, and export it as video.
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/tour">
                Create your series <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/#examples">Browse examples</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-6">
          <span className="kicker">Start here</span>
          <h2 className="font-display text-4xl text-balance md:text-5xl">
            See how it works in 30 seconds
          </h2>
          <StartHere />
        </div>
      </section>

      <section aria-labelledby="how-heading" className="flex flex-col gap-4">
        <h2 id="how-heading" className="kicker">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          <HowStep number="01" title="Describe it" icon={<UserRound aria-hidden="true" />}>
            Start from a character sheet and a plain idea, the way you would say it out loud.
          </HowStep>
          <HowStep number="02" title="Press Magic Prompt" icon={<Sparkles aria-hidden="true" />}>
            Your idea is rewritten with camera, light and character detail so it looks directed, not
            generic. Every change is explained.
          </HowStep>
          <HowStep number="03" title="Cut, fix, export" icon={<Scissors aria-hidden="true" />}>
            Split the clip at any moment, fix only the part that is wrong, and export the finished
            video.
          </HowStep>
        </ol>
      </section>

      <section aria-label="What you leave with" className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3 p-6">
          <span className="kicker">Cut anywhere</span>
          <h3 className="font-display text-4xl">Split and fix</h3>
          <p className="text-muted-foreground">
            Cut a clip wherever you like, or where Magic Prompt&apos;s timed beats change. Watch one
            segment on its own and fix it without touching the rest.
          </p>
          <SegmentsMark />
        </Card>
        <Card className="flex flex-col gap-3 p-6">
          <span className="kicker">Export</span>
          <h3 className="font-display text-4xl">Video</h3>
          <p className="text-muted-foreground">
            Export the finished clip as an MP4, ready to upload. Every set of takes is paid for
            once.
          </p>
          <p className="mt-auto flex items-center gap-2 font-label text-sm tracking-label text-muted-foreground">
            <Download aria-hidden="true" className="size-4" /> MP4 · 16:9
          </p>
        </Card>
      </section>

      <section
        aria-labelledby="cut-heading"
        className="flex flex-col items-start justify-between gap-6 rounded-2xl border-2 border-dashed border-primary p-6 sm:p-8 md:flex-row md:items-center"
      >
        <div className="flex flex-col gap-3">
          <span className="kicker">Cut here</span>
          <h2 id="cut-heading" className="font-display text-4xl text-balance">
            Try it with a ready-made character
          </h2>
        </div>
        <Button asChild size="lg">
          <Link href="/tour">Start the 30-second demo</Link>
        </Button>
      </section>
    </>
  );
}

function HowStep({
  number,
  title,
  icon,
  children,
}: {
  readonly number: string;
  readonly title: string;
  readonly icon: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <li>
      <Card className="flex h-full flex-col gap-3 p-6">
        <span className="kicker">
          <span className="sr-only">Step </span>
          {number} / 03
        </span>
        <h3 className="flex items-center gap-2 font-display text-3xl [&>svg]:size-6 [&>svg]:text-primary">
          {icon}
          {title}
        </h3>
        <p className="text-muted-foreground">{children}</p>
      </Card>
    </li>
  );
}

/**
 * A clip strip with two cuts in it: the mark for "this splits into
 * segments" (DESIGN.md §1, comic marks mean something). One segment is
 * picked, as on the project timeline.
 */
function SegmentsMark() {
  return (
    <div aria-hidden="true" className="mt-auto flex h-10 overflow-hidden rounded-sm">
      <span className="grow-3 bg-settled" />
      <span className="grow-2 border-s-2 border-canvas bg-primary" />
      <span className="grow-4 border-s-2 border-canvas bg-settled" />
    </div>
  );
}
