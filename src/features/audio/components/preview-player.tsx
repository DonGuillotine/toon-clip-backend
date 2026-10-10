"use client";

import { Pause, Play } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import { usePlaybackStore } from "../playback-store";
import { playedBars, waveform } from "../waveform";

const BARS = 48;

/**
 * Drives the one playing preview forward with animation frames. Mounted by
 * the playing item only, so at most one clock runs.
 */
function usePlaybackClock(playing: boolean, durationSec: number): void {
  const advance = usePlaybackStore((state) => state.advance);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      advance((now - last) / 1000, durationSec);
      last = now;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [playing, durationSec, advance]);
}

/**
 * A simulated preview: play and pause, a deterministic waveform that fills
 * as it plays, and the time. There is no real audio yet; the shape is seeded
 * from the id so it never changes between visits.
 */
export function PreviewPlayer({
  id,
  label,
  durationSec,
  compact = false,
}: {
  readonly id: string;
  /** What is playing, for the button's accessible name. */
  readonly label: string;
  readonly durationSec: number;
  readonly compact?: boolean;
}) {
  const playing = usePlaybackStore((state) => state.playingId === id);
  const position = usePlaybackStore((state) => state.positions[id] ?? 0);
  const toggle = usePlaybackStore((state) => state.toggle);
  usePlaybackClock(playing, durationSec);

  const bars = waveform(id, compact ? BARS / 2 : BARS);
  const played = playedBars(bars.length, durationSec > 0 ? position / durationSec : 0);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Button
        variant={playing ? "default" : "secondary"}
        size="icon-sm"
        aria-label={`${playing ? "Pause" : "Play"} preview of ${label}`}
        aria-pressed={playing}
        onClick={() => {
          toggle(id, durationSec);
        }}
      >
        {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </Button>
      <div
        role="img"
        aria-label={`Waveform, ${formatDuration(position)} of ${formatDuration(durationSec)} played`}
        className="flex h-8 min-w-0 flex-1 items-center gap-px"
      >
        {bars.map((height, index) => (
          <span
            key={index}
            className={cn(
              "h-full min-w-0.5 flex-1 rounded-full",
              index < played ? "bg-live-foreground" : "bg-pending",
            )}
            style={{ transform: `scaleY(${String(height)})` }}
          />
        ))}
      </div>
      <span className="tabular w-20 shrink-0 text-end text-xs text-muted-foreground">
        {formatDuration(position)} / {formatDuration(durationSec)}
      </span>
    </div>
  );
}
