"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { advance, clampTime, shuttle } from "./playback";

export type Playhead = {
  readonly timeSec: number;
  /** Signed playback rate: 0 paused, 1 normal, 2 or 4 fast, negative rewinds. */
  readonly rate: number;
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
  readonly seek: (timeSec: number) => void;
  readonly nudge: (deltaSec: number) => void;
  readonly shuttle: (direction: "forward" | "backward") => void;
};

/**
 * The player clock. A `requestAnimationFrame` loop advances the playhead by
 * the real time between frames, so playback keeps pace on slow devices and
 * stops when the tab is hidden. Local and ephemeral, so plain React state
 * (AGENTS.md §3); remount with a new `key` to start a different clip.
 */
export function usePlayhead(durationSec: number): Playhead {
  const [timeSec, setTimeSec] = useState(0);
  const [rate, setRate] = useState(0);
  // The loop reads the latest time without restarting on every frame.
  const timeRef = useRef(0);

  const commit = useCallback((next: number) => {
    timeRef.current = next;
    setTimeSec(next);
  }, []);

  useEffect(() => {
    if (rate === 0) return;
    let frame = 0;
    let last: number | null = null;
    const step = (now: number) => {
      const elapsed = last === null ? 0 : now - last;
      last = now;
      const tick = advance(timeRef.current, rate, elapsed, durationSec);
      commit(tick.timeSec);
      if (tick.ended) {
        setRate(0);
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [rate, durationSec, commit]);

  const play = useCallback(() => {
    // Pressing play at the end starts the clip over, like any player.
    if (timeRef.current >= durationSec) commit(0);
    setRate(1);
  }, [durationSec, commit]);

  const pause = useCallback(() => {
    setRate(0);
  }, []);

  const toggle = useCallback(() => {
    if (rate === 0) play();
    else setRate(0);
  }, [rate, play]);

  const seek = useCallback(
    (next: number) => {
      commit(clampTime(next, durationSec));
    },
    [durationSec, commit],
  );

  const nudge = useCallback(
    (deltaSec: number) => {
      commit(clampTime(timeRef.current + deltaSec, durationSec));
    },
    [durationSec, commit],
  );

  const shuttleTo = useCallback(
    (direction: "forward" | "backward") => {
      if (direction === "forward" && timeRef.current >= durationSec) commit(0);
      if (direction === "backward" && timeRef.current <= 0) return;
      setRate((current) => shuttle(current, direction));
    },
    [durationSec, commit],
  );

  return { timeSec, rate, play, pause, toggle, seek, nudge, shuttle: shuttleTo };
}
