import { type WatchSegment } from "./schema";

/**
 * Pure playback rules for the player. The hook in `use-playhead.ts` owns the
 * clock; everything it decides is computed here so it can be tested.
 */

/** Shuttle speeds for J and L, in the order a repeated press walks through. */
export const SHUTTLE_SPEEDS: readonly number[] = [1, 2, 4];

/** How far the arrow keys jump, in seconds. */
export const ARROW_STEP_SEC = 5;

export function clampTime(timeSec: number, durationSec: number): number {
  if (!Number.isFinite(timeSec)) return 0;
  return Math.min(durationSec, Math.max(0, timeSec));
}

/**
 * The segment under the playhead. The end of the clip belongs to the last
 * segment, so a finished clip still shows its final frame.
 */
export function segmentAt(
  segments: readonly WatchSegment[],
  timeSec: number,
): { readonly segment: WatchSegment; readonly index: number } | null {
  for (const [index, segment] of segments.entries()) {
    if (timeSec < segment.startSec + segment.durationSec) return { segment, index };
  }
  const index = segments.length - 1;
  const last = segments[index];
  return last ? { segment: last, index } : null;
}

/**
 * The next rate after pressing J (backward) or L (forward). Pressing the
 * same direction again speeds up to 4x; the other direction starts over at 1x.
 */
export function shuttle(rate: number, direction: "forward" | "backward"): number {
  const sign = direction === "forward" ? 1 : -1;
  const sameDirection = Math.sign(rate) === sign;
  if (!sameDirection) return sign * (SHUTTLE_SPEEDS[0] ?? 1);
  const current = SHUTTLE_SPEEDS.indexOf(Math.abs(rate));
  const next = SHUTTLE_SPEEDS[Math.min(current + 1, SHUTTLE_SPEEDS.length - 1)] ?? 1;
  return sign * next;
}

export type Tick = {
  readonly timeSec: number;
  /** True when the playhead hit either end and playback should stop. */
  readonly ended: boolean;
};

/** Advance the playhead by one frame of wall time. */
export function advance(
  timeSec: number,
  rate: number,
  elapsedMs: number,
  durationSec: number,
): Tick {
  const next = timeSec + (rate * elapsedMs) / 1000;
  if (next >= durationSec) return { timeSec: durationSec, ended: true };
  if (next <= 0 && rate < 0) return { timeSec: 0, ended: true };
  return { timeSec: Math.max(0, next), ended: false };
}

/** Where the head of a segment is, as a fraction of the segment (0 to 1). */
export function segmentProgress(segment: WatchSegment, timeSec: number): number {
  return Math.min(1, Math.max(0, (timeSec - segment.startSec) / segment.durationSec));
}

/** "Playing at 2x backward" style copy for the live region. */
export function describeRate(rate: number): string {
  if (rate === 0) return "Paused";
  const speed = `${String(Math.abs(rate))}x`;
  if (rate === 1) return "Playing";
  return rate > 0 ? `Playing at ${speed}` : `Rewinding at ${speed}`;
}
