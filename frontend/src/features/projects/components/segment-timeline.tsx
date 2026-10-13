"use client";

import { Combine, ListOrdered, Pause, Play, Scissors, X } from "lucide-react";
import { type ReactNode, useId } from "react";

import { Card, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type Beat, beatSummary, formatClock } from "@/features/catalog/beats";
import { type SegmentFix } from "@/features/segment-fixes/schema";
import { cn } from "@/lib/utils";

import { type Segment } from "../segments";
import { formatSeconds } from "../shots";
import { type VideoClock } from "../use-video-time";

/**
 * The shot as a strip of segments under the player. The slider is the
 * playhead; Split cuts the shot where it stands, Join removes the cut after
 * the selected segment, and the prompt's timed beats can be used as cuts.
 */
export function SegmentTimeline({
  durationSeconds,
  clock,
  segments,
  selected,
  beatCutsAvailable,
  beatCutsApplied,
  activeFixes,
  onSeek,
  onSelect,
  onTogglePlay,
  onSplit,
  onJoin,
  onCutOnBeats,
  onClearCuts,
}: {
  readonly durationSeconds: number;
  readonly clock: VideoClock;
  readonly segments: readonly Segment[];
  readonly selected: Segment;
  /** The selected take's prompt has timed beats to cut on. */
  readonly beatCutsAvailable: boolean;
  readonly beatCutsApplied: boolean;
  /** Fixes still rendering, marked on their segments. */
  readonly activeFixes: readonly SegmentFix[];
  readonly onSeek: (seconds: number) => void;
  readonly onSelect: (segment: Segment) => void;
  readonly onTogglePlay: () => void;
  readonly onSplit: () => void;
  readonly onJoin: () => void;
  readonly onCutOnBeats: () => void;
  readonly onClearCuts: () => void;
}) {
  const titleId = useId();
  const hintId = useId();
  const position = Math.min(durationSeconds, Math.max(0, clock.seconds));
  const percent = durationSeconds > 0 ? (position / durationSeconds) * 100 : 0;
  const cut = segments.length > 1;
  const isLast = selected.number === segments.length;

  return (
    <Card aria-labelledby={titleId} className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="font-display text-2xl">
          Timeline
        </h2>
        <p className="tabular font-label text-sm tracking-label text-muted-foreground">
          {formatClock(position)} / {formatClock(durationSeconds)}
          {cut ? ` · ${String(segments.length)} segments` : null}
        </p>
      </header>

      <div role="toolbar" aria-label="Timeline tools" className="flex flex-wrap gap-1">
        <Button variant="secondary" onClick={onTogglePlay}>
          {clock.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {clock.playing ? "Pause" : "Play"}
          <Kbd className="hidden lg:inline-flex">Space</Kbd>
        </Button>
        <Button variant="secondary" onClick={onSplit}>
          <Scissors aria-hidden="true" /> Split
          <Kbd className="hidden lg:inline-flex">S</Kbd>
        </Button>
        <Button variant="secondary" disabled={!cut || isLast} onClick={onJoin}>
          <Combine aria-hidden="true" /> Join with next
          <Kbd className="hidden lg:inline-flex">M</Kbd>
        </Button>
        {beatCutsAvailable && !beatCutsApplied ? (
          <Button variant="ghost" onClick={onCutOnBeats}>
            <ListOrdered aria-hidden="true" /> Cut on the prompt&apos;s beats
          </Button>
        ) : null}
        {cut ? (
          <Button variant="ghost" onClick={onClearCuts}>
            <X aria-hidden="true" /> Clear cuts
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 rounded-md bg-muted p-1.5">
        <Slider
          aria-label="Playhead"
          aria-describedby={hintId}
          min={0}
          max={durationSeconds}
          step={0.1}
          value={[position]}
          onValueChange={([next]) => {
            if (next !== undefined) onSeek(next);
          }}
          className="h-8"
        />
        <div className="relative">
          <ToggleGroup
            type="single"
            aria-label="Segments"
            value={String(selected.number)}
            onValueChange={(next) => {
              const found = segments.find((segment) => String(segment.number) === next);
              if (found !== undefined) onSelect(found);
            }}
            spacing={0}
            className="flex w-full overflow-hidden rounded-sm"
          >
            {segments.map((segment) => {
              const length = segment.endSeconds - segment.startSeconds;
              const rendering = activeFixes.some(
                (fix) =>
                  fix.startSeconds < segment.endSeconds && fix.endSeconds > segment.startSeconds,
              );
              return (
                <ToggleGroupItem
                  key={segment.number}
                  value={String(segment.number)}
                  aria-label={`Segment ${String(segment.number)}, ${formatClock(segment.startSeconds)} to ${formatClock(segment.endSeconds)}${rendering ? ", rendering a fix" : ""}`}
                  style={{ flexGrow: length }}
                  className={cn(
                    "relative h-14 min-w-0 basis-0 flex-col items-start justify-between overflow-hidden rounded-none bg-settled px-2 py-1.5 text-start text-foreground",
                    segment.number > 1 && "border-s-2 border-canvas",
                  )}
                >
                  <span className="tabular truncate font-label text-sm tracking-label">
                    {segment.number}
                  </span>
                  <span className="tabular hidden truncate text-xs opacity-80 sm:block">
                    {formatSeconds(length)}
                  </span>
                  {rendering ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-1.5 animate-speed bg-live speed-lines [--speed-angle:115deg] [--speed-gap:5px] [--speed-ink:oklch(1_0_0/0.45)] [--speed-weight:1px]"
                    />
                  ) : null}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          {/* The playhead over the strip. Moved with a transform, never `left`. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span
              className="absolute inset-y-0 start-0 w-full"
              style={{ transform: `translateX(${String(percent)}%)` }}
            >
              <span className="absolute inset-y-0 -ms-px w-0.5 bg-foreground" />
            </span>
          </span>
        </div>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        {cut
          ? "Pick a segment to watch it on its own or fix just that part."
          : "Move the playhead and press Split to cut the shot anywhere, then work on one part at a time."}
      </p>
    </Card>
  );
}

/**
 * The selected segment: where it sits, what the prompt asks for there, and
 * what can be done with it.
 */
export function SegmentDetail({
  segment,
  total,
  beats,
  onPlay,
  children,
}: {
  readonly segment: Segment;
  readonly total: number;
  readonly beats: readonly Beat[];
  readonly onPlay: () => void;
  readonly children: ReactNode;
}) {
  const titleId = useId();
  const length = segment.endSeconds - segment.startSeconds;
  const inside = beats.filter(
    (beat) => beat.startSeconds < segment.endSeconds && beat.endSeconds > segment.startSeconds,
  );

  return (
    <Section
      title={`Segment ${String(segment.number)}`}
      titleId={titleId}
      description={`${String(segment.number)} of ${String(total)} · ${formatClock(segment.startSeconds)} to ${formatClock(segment.endSeconds)} · ${formatSeconds(length)}`}
      action={
        <Button variant="secondary" onClick={onPlay}>
          <Play aria-hidden="true" /> Play segment
        </Button>
      }
      well={false}
    >
      <div className="flex flex-col gap-2">
        {inside.length === 0 ? null : (
          <div className="flex flex-col gap-1 rounded-md bg-muted p-1">
            <h3 className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
              What the prompt asks for here
            </h3>
            <ol className="flex flex-col gap-1">
              {inside.map((beat) => (
                <li
                  key={beat.startSeconds}
                  className="flex flex-col gap-1 rounded-sm bg-card px-3 py-2.5"
                >
                  <span className="tabular font-label text-xs tracking-label text-muted-foreground">
                    {formatClock(beat.startSeconds)} to {formatClock(beat.endSeconds)}
                  </span>
                  <span className="text-sm">{beatSummary(beat)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {children}
      </div>
    </Section>
  );
}
