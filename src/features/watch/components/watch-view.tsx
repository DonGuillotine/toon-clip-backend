"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Play, Tv } from "lucide-react";
import Link from "next/link";
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";

import { CoverArt } from "@/components/comic/cover-art";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import { watchLibraryQuery } from "../queries";
import { type WatchItem } from "../schema";
import { Player } from "./player";

const FILTERS: readonly ["all", "storyboard", "generation"] = ["all", "storyboard", "generation"];
type Filter = (typeof FILTERS)[number];

const FILTER_LABEL = {
  all: "All",
  storyboard: "Storyboards",
  generation: "Quick create",
} satisfies Record<Filter, string>;

function isFilter(value: string): value is Filter {
  return FILTERS.some((filter) => filter === value);
}

/**
 * Watch (spec section 5): play back finished work. The open clip, the filter
 * and the captions preference live in the URL, so a pasted link reopens the
 * same clip with the same captions.
 */
export function WatchView() {
  const [itemId, setItemId] = useQueryState("item", parseAsString);
  const [captions, setCaptions] = useQueryState("captions", parseAsBoolean.withDefault(false));
  const [filter, setFilter] = useQueryState(
    "kind",
    parseAsStringLiteral(FILTERS).withDefault("all"),
  );
  const library = useQuery(watchLibraryQuery);

  if (library.isPending) {
    return (
      <div
        className="flex flex-col gap-4 md:gap-8"
        aria-busy="true"
        aria-label="Loading finished work"
      >
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (library.isError) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm">Your finished work did not load.</p>
        <Button variant="secondary" onClick={() => void library.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  const items = library.data;
  if (items.length === 0) return <EmptyLibrary />;

  const requested = itemId === null ? null : (items.find((item) => item.id === itemId) ?? null);
  const playing = itemId === null ? (items[0] ?? null) : requested;
  const shown = filter === "all" ? items : items.filter((item) => item.kind === filter);

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {playing ? (
        <Player
          key={playing.id}
          item={playing}
          captions={captions}
          onCaptionsChange={(on) => void setCaptions(on ? true : null)}
        />
      ) : (
        <Card className="flex flex-col items-start gap-3 p-6">
          <h2 className="text-base font-semibold">That clip is not here.</h2>
          <p className="text-sm text-muted-foreground">
            The link may be old, or the clip was removed. Pick another from your finished work.
          </p>
          <Button variant="secondary" onClick={() => void setItemId(null)}>
            Play the newest clip
          </Button>
        </Card>
      )}

      <Section
        title="Finished work"
        titleId="watch-library"
        count={items.length}
        description="Storyboards with at least one finished shot, and quick create results."
        action={
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            value={filter}
            onValueChange={(next) => {
              if (isFilter(next)) void setFilter(next === "all" ? null : next);
            }}
            aria-label="Show"
          >
            {FILTERS.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {FILTER_LABEL[value]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      >
        {shown.length === 0 ? (
          <div className="flex flex-col items-start gap-3 p-3">
            <p className="text-sm">Nothing finished here yet.</p>
            <Button variant="secondary" onClick={() => void setFilter(null)}>
              Show everything
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((item) => (
              <WatchTile key={item.id} item={item} active={item.id === playing?.id} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function WatchTile({ item, active }: { readonly item: WatchItem; readonly active: boolean }) {
  return (
    <li>
      <Link
        href={`/watch?item=${encodeURIComponent(item.id)}`}
        aria-current={active ? "true" : undefined}
        className={cn(
          "group flex flex-col gap-1 rounded-sm p-1 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card",
          active && "bg-card",
        )}
      >
        <span className="relative block aspect-8/5 overflow-hidden rounded-xs">
          <CoverArt art={item.cover.art} sfx={item.cover.sfx} className="absolute inset-0" />
          <Badge variant="overlay" className="absolute start-2 top-2">
            {item.kind === "storyboard" ? "Storyboard" : "Quick create"}
          </Badge>
          <Badge variant="overlay" className="tabular absolute end-2 bottom-2">
            {active ? (
              <>
                <Tv aria-hidden="true" /> Now playing
              </>
            ) : (
              <>
                <Play aria-hidden="true" /> {formatDuration(item.durationSec)}
              </>
            )}
          </Badge>
        </span>
        <span className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
          <span className="truncate text-sm font-medium">{item.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {item.subtitle} ·{" "}
            {formatDistanceToNowStrict(new Date(item.updatedAt), { addSuffix: true })}
          </span>
        </span>
      </Link>
    </li>
  );
}

function EmptyLibrary() {
  return (
    <Card className="flex flex-col items-start gap-4 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Nothing to watch yet.</h2>
        <p className="max-w-lg text-sm text-muted-foreground">
          A clip lands here once a storyboard has a finished shot or a quick create result is ready.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/">Start a storyboard</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/create">Quick create</Link>
        </Button>
      </div>
    </Card>
  );
}
