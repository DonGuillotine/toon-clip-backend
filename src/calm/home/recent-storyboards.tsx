"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PanelArt } from "@/components/manga/panel-art";
import { Badge } from "@/components/ui/calm/badge";
import { Button } from "@/components/ui/calm/button";
import { Skeleton } from "@/components/ui/calm/skeleton";
import { recentStoryboardsQuery } from "@/features/storyboards/queries";
import { type StoryboardSummary } from "@/features/storyboards/schema";

import { Card } from "../card";

import { CalmShotStrip } from "./shot-strip";

const SHOWN = 4;

export function CalmRecentStoryboards() {
  const { data, isPending, isError, refetch } = useQuery(recentStoryboardsQuery);

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="recent-heading" className="text-base font-semibold">
          Pick up where you left off
        </h2>
        <Button asChild variant="link" size="sm">
          <Link href="/calm/storyboards">
            All storyboards <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: SHOWN }, (_, index) => (
            <Skeleton key={`slot-${String(index)}`} className="h-64 rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <Card className="flex flex-col items-start gap-3 p-5">
          <p className="font-medium">Your storyboards did not load.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </Card>
      ) : data.length === 0 ? (
        <Card className="flex flex-col items-start gap-1 p-5">
          <p className="font-medium">Nothing here yet</p>
          <p className="text-sm text-ink-soft">
            Your storyboards will show up here once you make one.
          </p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.slice(0, SHOWN).map((storyboard) => (
            <li key={storyboard.id} className="min-w-0">
              <StoryboardCard storyboard={storyboard} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * An ordinary media card. The cover is where the comic lives: it is the
 * creator's work (placeholder art until real takes exist), so it keeps its
 * screentone and SFX while the frame around it stays plain.
 */
function StoryboardCard({ storyboard }: { readonly storyboard: StoryboardSummary }) {
  const updated = formatDistanceToNowStrict(new Date(storyboard.updatedAt), { addSuffix: true });

  return (
    <Card className="group/card h-full overflow-hidden transition-[box-shadow,transform] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-float">
      <Link
        href={`/calm/storyboards/${storyboard.id}`}
        className="flex h-full flex-col outline-offset-2"
      >
        <div className="relative aspect-video overflow-hidden border-b border-line">
          <PanelArt
            art={storyboard.cover.art}
            sfx={storyboard.cover.sfx}
            className="absolute inset-0 origin-center scale-[0.98] transition-transform duration-(--duration-slow) ease-out group-hover/card:scale-[1.03]"
          />
          <div className="absolute end-2 bottom-2 flex gap-1">
            <Badge variant="overlay">{storyboard.style}</Badge>
            <Badge variant="overlay">{storyboard.aspectRatio}</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-3.5">
          <div className="flex flex-col gap-0.5">
            <h3 className="truncate text-sm font-semibold">{storyboard.title}</h3>
            <p className="text-xs text-ink-mute">Edited {updated}</p>
          </div>
          <div className="mt-auto">
            <CalmShotStrip shots={storyboard.shots} />
          </div>
        </div>
      </Link>
    </Card>
  );
}
