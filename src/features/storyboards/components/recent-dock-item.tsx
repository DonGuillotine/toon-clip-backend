"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowRight, Clapperboard } from "lucide-react";
import Link from "next/link";

import { CoverArt } from "@/components/comic/cover-art";
import { DockCount, DockFan, DockItem, FanLabel } from "@/components/dock/dock";

import { recentStoryboardsQuery } from "../queries";
import { type ShotState, type StoryboardSummary } from "../schema";
import { SHOT_STATE_META } from "../shot-state";

const SHOWN = 4;
const ATTENTION: readonly ShotState[] = ["failed", "flagged", "generating"];

/** The first state worth naming for a storyboard, as words. */
function attention(storyboard: StoryboardSummary): string | null {
  for (const state of ATTENTION) {
    const count = storyboard.shots.filter((shot) => shot.state === state).length;
    if (count > 0) return `${String(count)} ${SHOT_STATE_META[state].label.toLowerCase()}`;
  }
  return null;
}

/**
 * A cover is composed for 320 x 200. It is drawn at that size and scaled
 * down, so the composition holds at card and dot size alike.
 */
function Thumb({
  storyboard,
  size,
}: {
  readonly storyboard: StoryboardSummary;
  readonly size: "card" | "dot";
}) {
  if (size === "dot") {
    return (
      <span className="pointer-events-none relative block size-9 overflow-hidden rounded-full">
        <CoverArt
          art={storyboard.cover.art}
          sfx={null}
          className="absolute start-1/2 top-1/2 h-50 w-80 -translate-1/2 scale-[0.18]"
        />
      </span>
    );
  }
  return (
    <span className="block shrink-0 rounded-sm bg-card p-1 shadow-overlay">
      <span className="pointer-events-none relative block h-12.5 w-20 overflow-hidden rounded-xs">
        <CoverArt
          art={storyboard.cover.art}
          sfx={null}
          className="absolute start-0 top-0 h-50 w-80 origin-top-left scale-25"
        />
      </span>
    </span>
  );
}

/** Recent storyboards: a circle showing the latest cover; hover fans the deck. */
export function RecentDockItem() {
  const { data } = useQuery(recentStoryboardsQuery);
  const latest = data?.[0];

  return (
    <DockItem
      bare
      label={data ? `Recent storyboards, ${String(data.length)}` : "Recent storyboards"}
      icon={
        data && latest ? (
          <>
            <Thumb storyboard={latest} size="dot" />
            <DockCount count={data.length} />
          </>
        ) : (
          <Clapperboard aria-hidden="true" className="size-4 text-muted-foreground" />
        )
      }
    >
      {data === undefined ? null : (
        <DockFan>
          {[
            ...data.slice(0, SHOWN).map((storyboard) => {
              const note = attention(storyboard);
              const updated = formatDistanceToNowStrict(new Date(storyboard.updatedAt), {
                addSuffix: true,
              });
              return (
                <Link
                  key={storyboard.id}
                  href={`/storyboards/${storyboard.id}`}
                  className="group flex items-center gap-3 rounded-md"
                >
                  <FanLabel
                    title={storyboard.title}
                    detail={note === null ? updated : `${updated} · ${note}`}
                  />
                  <span className="transition-transform duration-(--duration-press) ease-out-strong group-hover:-translate-x-1 group-hover:scale-105">
                    <Thumb storyboard={storyboard} size="card" />
                  </span>
                </Link>
              );
            }),
            <Link
              key="all"
              href="/storyboards"
              className="flex h-8 items-center gap-1.5 rounded-full bg-popover px-3 text-sm font-medium shadow-overlay hover:bg-accent"
            >
              All storyboards <ArrowRight aria-hidden="true" className="size-4" />
            </Link>,
          ]}
        </DockFan>
      )}
    </DockItem>
  );
}
