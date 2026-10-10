"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Caption, Panel } from "@/components/manga/panel";
import { PanelArt } from "@/components/manga/panel-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { recentStoryboardsQuery } from "../queries";
import { type StoryboardSummary } from "../schema";

import { ShotStrip } from "./shot-strip";

/**
 * Panel sizes for the first four storyboards: a zig-zag like a manga page,
 * wide then narrow, narrow then wide.
 */
const LAYOUT: readonly string[] = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
];

export function RecentStoryboards() {
  const { data, isPending, isError, refetch } = useQuery(recentStoryboardsQuery);

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 id="recent-heading" className="font-display text-2xl">
          Pick up where you left off
        </h2>
        <Button asChild variant="link" size="sm">
          <Link href="/storyboards">
            All storyboards <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-3 md:grid-cols-12">
          {LAYOUT.map((span, index) => (
            <Skeleton key={`slot-${String(index)}`} className={cn("h-72 rounded-none", span)} />
          ))}
        </div>
      ) : isError ? (
        <Panel className="flex flex-col items-start gap-3 p-6">
          <p className="font-bold">Your storyboards did not load.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </Panel>
      ) : data.length === 0 ? (
        <Panel className="flex flex-col items-start gap-2 p-6">
          <p className="font-display text-xl">Nothing here yet</p>
          <p className="text-ink-soft">Your storyboards will show up here once you make one.</p>
        </Panel>
      ) : (
        <ul className="grid gap-3 md:grid-cols-12">
          {data.slice(0, LAYOUT.length).map((storyboard, index) => (
            <li key={storyboard.id} className={cn("min-w-0", LAYOUT[index])}>
              <StoryboardPanel storyboard={storyboard} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StoryboardPanel({ storyboard }: { readonly storyboard: StoryboardSummary }) {
  const updated = formatDistanceToNowStrict(new Date(storyboard.updatedAt), { addSuffix: true });

  return (
    <Panel className="group/panel h-full">
      <Link
        href={`/storyboards/${storyboard.id}`}
        className="flex h-full flex-col outline-offset-4"
      >
        <div className="relative h-52 border-b-3 border-ink">
          <PanelArt
            art={storyboard.cover.art}
            sfx={storyboard.cover.sfx}
            className="absolute inset-0 transition-transform duration-(--duration-slow) ease-out group-hover/panel:scale-[1.03]"
          />
          <Caption className="absolute start-3 top-3 max-w-[75%]">
            <h3 className="font-display text-lg leading-tight">{storyboard.title}</h3>
            <p className="text-xs text-ink-soft">Edited {updated}</p>
          </Caption>
          <div className="absolute end-3 bottom-3 flex gap-1.5">
            <Badge>{storyboard.style}</Badge>
            <Badge>{storyboard.aspectRatio}</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end p-3">
          <ShotStrip shots={storyboard.shots} />
        </div>
      </Link>
    </Panel>
  );
}
