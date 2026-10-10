"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";

import { CoverArt } from "@/components/comic/cover-art";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

import { recentStoryboardsQuery } from "../queries";
import { type ShotState, type StoryboardSummary } from "../schema";
import { SHOT_STATE_META } from "../shot-state";
import { filterStoryboards } from "../search";

const ATTENTION: readonly ShotState[] = ["failed", "flagged", "generating"];

/** The first state worth calling out on a tile, or `null` when all is calm. */
function attention(storyboard: StoryboardSummary) {
  for (const state of ATTENTION) {
    const count = storyboard.shots.filter((shot) => shot.state === state).length;
    if (count > 0) return { state, count };
  }
  return null;
}

function Tile({ storyboard }: { readonly storyboard: StoryboardSummary }) {
  const length = storyboard.shots.reduce((sum, shot) => sum + shot.durationSec, 0);
  const note = attention(storyboard);
  const meta = note ? SHOT_STATE_META[note.state] : null;
  const Icon = meta?.icon;
  return (
    <li>
      <Link
        href={`/storyboards/${storyboard.id}`}
        className="group flex flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
      >
        <span className="relative block aspect-8/5 overflow-hidden rounded-xs">
          <CoverArt
            art={storyboard.cover.art}
            sfx={storyboard.cover.sfx}
            className="absolute inset-0"
          />
          <Badge variant="overlay" className="absolute start-2 top-2">
            Sample art
          </Badge>
        </span>
        <span className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
          <span className="truncate text-sm font-medium">{storyboard.title}</span>
          <span className="tabular text-xs text-muted-foreground">
            {storyboard.shots.length} shots · {formatDuration(length)} ·{" "}
            {formatDistanceToNowStrict(new Date(storyboard.updatedAt), { addSuffix: true })}
          </span>
          {note && meta && Icon ? (
            <span className={cn("flex items-center gap-1 text-xs", meta.tone)}>
              <Icon aria-hidden="true" className="size-3.5" />
              {note.count} {meta.label.toLowerCase()}
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/** Every storyboard, searchable. The search term lives in the URL (`?q=`). */
export function StoryboardList() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const storyboards = useQuery(recentStoryboardsQuery);
  // The dock fetches the same list; wait for hydration so the first render matches.
  const hydrated = useHydrated();
  const shown = filterStoryboards(storyboards.data ?? [], q);

  return (
    <Section
      title="Your storyboards"
      titleId="storyboards-heading"
      count={hydrated && storyboards.data ? storyboards.data.length : null}
      action={
        <div className="relative w-48 sm:w-64">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Search storyboards"
            placeholder="Search"
            value={q}
            onChange={(event) => void setQ(event.target.value === "" ? null : event.target.value)}
            className="ps-9"
          />
        </div>
      }
    >
      {!hydrated || storyboards.isPending ? (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="aspect-4/3 rounded-sm" />
          ))}
        </div>
      ) : storyboards.isError ? (
        <div className="flex flex-col items-start gap-3 p-3">
          <p className="text-sm">Storyboards did not load.</p>
          <Button variant="secondary" onClick={() => void storyboards.refetch()}>
            Try again
          </Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-start gap-3 p-3">
          <p className="text-sm">
            {q === ""
              ? "Storyboards you make from an idea show up here."
              : `No storyboard matches "${q}".`}
          </p>
          {q === "" ? (
            <Button asChild variant="secondary">
              <Link href="/">Start one</Link>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void setQ(null)}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          {shown.map((storyboard) => (
            <Tile key={storyboard.id} storyboard={storyboard} />
          ))}
        </ul>
      )}
    </Section>
  );
}
