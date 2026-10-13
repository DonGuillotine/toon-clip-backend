import { create } from "zustand";

/**
 * Cross-cutting timeline state with no server or URL home: the playhead, the
 * shuttle rate and the undo stack. It holds revision numbers and labels, never
 * storyboard data; that stays in TanStack Query.
 */

export type UndoEntry = {
  readonly label: string;
  /** Revision to restore on undo. */
  readonly before: number;
  /** Revision to restore on redo. */
  readonly after: number;
};

type TimelineState = {
  readonly storyboardId: string | null;
  readonly playheadSec: number;
  /** 0 is paused; negative plays backwards (J K L shuttle). */
  readonly rate: number;
  readonly past: readonly UndoEntry[];
  readonly future: readonly UndoEntry[];
  /** Resets everything when a different storyboard opens. */
  readonly open: (storyboardId: string) => void;
  readonly seek: (sec: number) => void;
  readonly setRate: (rate: number) => void;
  readonly record: (entry: UndoEntry) => void;
  /** Moves the top entry from one stack to the other once the API confirms it. */
  readonly undone: () => void;
  readonly redone: () => void;
};

export const useTimelineStore = create<TimelineState>()((set) => ({
  storyboardId: null,
  playheadSec: 0,
  rate: 0,
  past: [],
  future: [],
  open: (storyboardId) => {
    set((state) =>
      state.storyboardId === storyboardId
        ? state
        : { storyboardId, playheadSec: 0, rate: 0, past: [], future: [] },
    );
  },
  seek: (sec) => {
    set({ playheadSec: Math.max(0, sec) });
  },
  setRate: (rate) => {
    set({ rate });
  },
  record: (entry) => {
    set((state) => ({ past: [...state.past, entry], future: [] }));
  },
  undone: () => {
    set((state) => {
      const entry = state.past.at(-1);
      if (!entry) return state;
      return { past: state.past.slice(0, -1), future: [...state.future, entry] };
    });
  },
  redone: () => {
    set((state) => {
      const entry = state.future.at(-1);
      if (!entry) return state;
      return { future: state.future.slice(0, -1), past: [...state.past, entry] };
    });
  },
}));
