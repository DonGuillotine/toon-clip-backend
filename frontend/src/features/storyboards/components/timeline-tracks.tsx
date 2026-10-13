"use client";

import { useQuery } from "@tanstack/react-query";
import { AudioLines, Clapperboard } from "lucide-react";

import { CoverArt } from "@/components/comic/cover-art";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import { shotJobQuery } from "../queries";
import { type Shot, type StoryboardDetail } from "../schema";
import { SHOT_STATE_META } from "../shot-state";
import { placeShots, selectedTake, shotAt, totalDuration, type PlacedShot } from "../timeline";
import { useTimelineStore } from "../timeline-store";
import { ArtThumb, ShotStateLabel } from "./shot-bits";

/** The job id of a shot that is waiting or generating, once the API has one. */
export function activeJobId(shot: Shot): string | null {
  if (shot.state !== "queued" && shot.state !== "generating") return null;
  return shot.jobId.includes("_pending_") ? null : shot.jobId;
}

/** Generation progress for a shot, read from its polled job. `null` when unknown. */
export function useShotProgress(storyboardId: string, shot: Shot): number | null {
  const jobId = activeJobId(shot);
  const job = useQuery({ ...shotJobQuery(storyboardId, jobId ?? ""), enabled: jobId !== null });
  if (jobId === null || job.data?.status !== "generating") return null;
  return job.data.progress;
}

const ASPECT = {
  "16:9": "aspect-video w-full",
  "9:16": "aspect-9/16 h-80 sm:h-96",
  "1:1": "aspect-square h-80 sm:h-96",
} satisfies Record<StoryboardDetail["aspectRatio"], string>;

/** The preview: the selected take of the shot under the playhead, as sample art. */
export function TimelinePreview({ detail }: { readonly detail: StoryboardDetail }) {
  const playheadSec = useTimelineStore((state) => state.playheadSec);
  const total = totalDuration(detail);
  const current = shotAt(detail, playheadSec);
  const take = current ? selectedTake(current.shot) : undefined;

  return (
    <Card aria-label="Preview" className="flex flex-col">
      <div className="flex justify-center rounded-md bg-muted p-1">
        <div
          className={cn(
            "relative overflow-hidden rounded-sm bg-comic-ink",
            ASPECT[detail.aspectRatio],
          )}
        >
          {take ? (
            <CoverArt art={take.art} sfx={null} className="absolute inset-0" />
          ) : current ? (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                SHOT_STATE_META[current.shot.state].fill,
              )}
            >
              <span className="rounded-xs bg-card px-3 py-1">
                <ShotStateLabel state={current.shot.state} />
              </span>
            </div>
          ) : null}
          <Badge variant="overlay" className="absolute start-2 top-2">
            Sample art
          </Badge>
          {current ? (
            <Badge variant="overlay" className="absolute start-2 bottom-2">
              Shot {current.number}
              {take ? ` · take ${String(take.number)}` : ""}
            </Badge>
          ) : null}
          <Badge variant="overlay" className="tabular absolute end-2 bottom-2">
            {formatDuration(playheadSec)} / {formatDuration(total)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function Playhead({ total }: { readonly total: number }) {
  const playheadSec = useTimelineStore((state) => state.playheadSec);
  const percent = total === 0 ? 0 : Math.min(100, (playheadSec / total) * 100);
  return (
    // A full-width layer moved by transform, so the playhead animates
    // without touching layout.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ transform: `translateX(${String(percent)}%)` }}
    >
      <div className="absolute inset-y-0 start-0 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
    </div>
  );
}

type SegmentProps = {
  readonly storyboardId: string;
  readonly item: PlacedShot;
  readonly selected: boolean;
  readonly onSelect: (item: PlacedShot) => void;
};

function Segment({ storyboardId, item, selected, onSelect }: SegmentProps) {
  const meta = SHOT_STATE_META[item.shot.state];
  const Icon = meta.icon;
  const progress = useShotProgress(storyboardId, item.shot);
  return (
    <Button
      variant="ghost"
      aria-pressed={selected}
      aria-label={`Shot ${String(item.number)}, ${meta.label}${progress === null ? "" : ` ${String(progress)}%`}, ${String(item.shot.durationSec)} seconds`}
      onClick={() => {
        onSelect(item);
      }}
      style={{ flexGrow: item.shot.durationSec, flexBasis: 0 }}
      className={cn(
        "h-16 min-w-0 flex-col items-stretch justify-between gap-1 rounded-sm bg-card p-1.5 text-start text-foreground hover:bg-card",
        selected && "bg-spot text-spot-foreground hover:bg-spot-hover",
      )}
    >
      <span className={cn("block h-1.5 w-full rounded-full", meta.fill)} />
      <span className="flex min-w-0 items-center gap-1 text-xs">
        <Icon aria-hidden="true" className="size-3.5" />
        <span className="truncate">{item.number}</span>
      </span>
      <span className={cn("truncate text-xs", selected ? "text-spot-foreground" : meta.tone)}>
        {progress === null ? meta.label : `${String(progress)}%`}
      </span>
    </Button>
  );
}

type TracksProps = {
  readonly detail: StoryboardDetail;
  readonly selectedId: string | null;
  readonly onSelect: (item: PlacedShot) => void;
};

/** Video and audio tracks with the playhead. Tablet and desktop. */
export function TimelineTracks({ detail, selectedId, onSelect }: TracksProps) {
  const placed = placeShots(detail);
  const total = totalDuration(detail);
  return (
    <Section
      title="Timeline"
      titleId="timeline-tracks-heading"
      description={`${String(placed.length)} shots in ${String(detail.sheets.length)} sheets, ${formatDuration(total)}`}
      className="hidden md:flex"
    >
      <div className="flex gap-1 p-1">
        <div className="flex shrink-0 flex-col gap-1 pt-6 text-xs text-muted-foreground">
          <span className="flex h-16 items-center gap-1">
            <Clapperboard aria-hidden="true" className="size-3.5" /> Video
          </span>
          <span className="flex h-8 items-center gap-1">
            <AudioLines aria-hidden="true" className="size-3.5" /> Audio
          </span>
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex h-5 gap-0.5 text-xs text-muted-foreground">
            {detail.sheets.map((sheet) => {
              const length = sheet.shots.reduce((sum, shot) => sum + shot.durationSec, 0);
              return (
                <span
                  key={sheet.id}
                  className="truncate"
                  style={{ flexGrow: length, flexBasis: 0 }}
                >
                  {sheet.title}
                </span>
              );
            })}
          </div>
          <div role="group" aria-label="Video track" className="flex gap-0.5">
            {placed.map((item) => (
              <Segment
                key={item.shot.id}
                storyboardId={detail.id}
                item={item}
                selected={item.shot.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
          <div aria-label="Audio track" role="group" className="flex h-8 gap-0.5">
            {detail.audio.map((clip) => (
              <span
                key={clip.id}
                className="flex min-w-0 items-center rounded-sm bg-secondary px-2 text-xs text-muted-foreground"
                style={{ flexGrow: clip.durationSec, flexBasis: 0 }}
              >
                <span className="truncate">{clip.label}</span>
              </span>
            ))}
          </div>
          <Playhead total={total} />
        </div>
      </div>
    </Section>
  );
}

/** Mobile: the timeline becomes a strip of shots that scrolls sideways. */
export function ShotStrip({ detail, selectedId, onSelect }: TracksProps) {
  const placed = placeShots(detail);
  return (
    <Section title="Shots" titleId="shot-strip-heading" count={placed.length} className="md:hidden">
      <ul className="flex gap-1 overflow-x-auto p-1">
        {placed.map((item) => {
          const take = selectedTake(item.shot);
          const selected = item.shot.id === selectedId;
          return (
            <li key={item.shot.id} className="shrink-0">
              <Button
                variant="ghost"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(item);
                }}
                className={cn(
                  "h-auto w-24 flex-col items-start gap-1 rounded-sm bg-card p-1 text-start text-foreground hover:bg-card",
                  selected && "bg-spot text-spot-foreground hover:bg-spot-hover",
                )}
              >
                {take ? (
                  <ArtThumb art={take.art} />
                ) : (
                  <span
                    className={cn(
                      "block h-12.5 w-20 rounded-xs",
                      SHOT_STATE_META[item.shot.state].fill,
                    )}
                  />
                )}
                <span className="px-1 text-xs font-medium">Shot {item.number}</span>
                <ShotStateLabel
                  state={item.shot.state}
                  className={cn("px-1 pb-1", selected && "text-spot-foreground")}
                />
              </Button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
