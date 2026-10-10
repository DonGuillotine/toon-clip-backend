import { create } from "zustand";

/**
 * Simulated preview playback. No real audio exists yet, so playing moves a
 * position along a clip's length. Only one clip or voice plays at a time,
 * across the library and the voice list, which is why this is a store and not
 * local state. It holds ids and positions, never clip data (that is Query's).
 */

type PlaybackState = {
  /** The clip or voice preview playing now, or null. */
  readonly playingId: string | null;
  /** Seconds into each item that has been played, so pausing keeps the spot. */
  readonly positions: Readonly<Record<string, number>>;
  readonly toggle: (id: string, durationSec: number) => void;
  readonly advance: (deltaSec: number, durationSec: number) => void;
  readonly stop: () => void;
};

/** Where playback is after `deltaSec` more seconds. Pure, so it is testable. */
export function advancePosition(
  position: number,
  deltaSec: number,
  durationSec: number,
): { readonly position: number; readonly ended: boolean } {
  const next = position + Math.max(0, deltaSec);
  if (next >= durationSec) return { position: durationSec, ended: true };
  return { position: next, ended: false };
}

export const usePlaybackStore = create<PlaybackState>()((set) => ({
  playingId: null,
  positions: {},
  toggle: (id, durationSec) => {
    set((state) => {
      if (state.playingId === id) return { playingId: null };
      // Starting from the end replays from the top.
      const at = state.positions[id] ?? 0;
      const position = at >= durationSec ? 0 : at;
      return { playingId: id, positions: { ...state.positions, [id]: position } };
    });
  },
  advance: (deltaSec, durationSec) => {
    set((state) => {
      const id = state.playingId;
      if (id === null) return {};
      const { position, ended } = advancePosition(state.positions[id] ?? 0, deltaSec, durationSec);
      return {
        playingId: ended ? null : id,
        positions: { ...state.positions, [id]: position },
      };
    });
  },
  stop: () => {
    set({ playingId: null });
  },
}));
