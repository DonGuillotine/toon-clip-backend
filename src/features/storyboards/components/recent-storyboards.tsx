"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CoverArt } from "@/components/comic/cover-art";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { recentStoryboardsQuery } from "../queries";
import { type StoryboardSummary } from "../schema";

import { ShotStrip } from "./shot-strip";

const SHOWN = 4;
const GRID = "grid gap-1 sm:grid-cols-2 xl:grid-cols-4";

export function RecentStoryboards() {
  const { data, isPending, isError, refetch } = useQuery(recentStoryboardsQuery);

  return (
    <Section
      title="Pick up where you left off"
      titleId="recent-heading"
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/storyboards">
            All storyboards <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      {isPending ? (
        <div className={GRID}>
          {Array.from({ length: SHOWN }, (_, index) => (
            <Skeleton key={`slot-${String(index)}`} className="h-60 rounded-sm" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 p-4">
          <p className="text-sm font-medium">Your storyboards did not load.</p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-start gap-1 p-4">
          <p className="text-sm font-medium">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            Your storyboards will show up here once you make one.
          </p>
        </div>
      ) : (
        <ul className={GRID}>
          {data.slice(0, SHOWN).map((storyboard) => (
            <li key={storyboard.id} className="min-w-0">
              <StoryboardTile storyboard={storyboard} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * A tile in the well (r12, inside a r16 well with 4px padding). It rests on
 * L1 and lifts to L2 on hover. The cover is where the comic lives: it stands
 * in for the creator's own work, so it keeps its screentone and SFX.
 */
function StoryboardTile({ storyboard }: { readonly storyboard: StoryboardSummary }) {
  const updated = formatDistanceToNowStrict(new Date(storyboard.updatedAt), { addSuffix: true });

  return (
    <Link
      href={`/storyboards/${storyboard.id}`}
      className="group/tile flex h-full flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
    >
      <div className="relative aspect-video overflow-hidden rounded-xs">
        <CoverArt
          art={storyboard.cover.art}
          sfx={storyboard.cover.sfx}
          className="absolute inset-0 transition-transform duration-(--duration-slow) ease-out-strong group-hover/tile:scale-[1.03]"
        />
        <div className="absolute end-1.5 bottom-1.5 flex gap-1">
          <Badge variant="overlay">{storyboard.style}</Badge>
          <Badge variant="overlay">{storyboard.aspectRatio}</Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-2.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="truncate text-sm font-medium">{storyboard.title}</h3>
          <p className="text-xs text-muted-foreground">Edited {updated}</p>
        </div>
        <div className="mt-auto">
          <ShotStrip shots={storyboard.shots} />
        </div>
      </div>
    </Link>
  );
}
