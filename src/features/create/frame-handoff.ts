import { create } from "zustand";

import { type Frame, type FrameSlot } from "./components/frame-slots";

type Pending = {
  readonly first: Frame | null;
  readonly last: Frame | null;
  /** A prompt carried over from the home composer. */
  readonly prompt: string | null;
};

type HandoffState = {
  readonly pending: Pending;
  /** Hand a frame to Quick create's frame mode, from the board or the timeline. */
  readonly give: (slot: FrameSlot, frame: Frame) => void;
  /** Hand a prompt to Quick create, so an idea typed on home is not lost. */
  readonly givePrompt: (prompt: string) => void;
  /** Quick create empties the handoff once it holds what was handed over. */
  readonly clear: () => void;
};

const EMPTY: Pending = { first: null, last: null, prompt: null };

/**
 * What is on its way into Quick create. Cross-cutting client state with no
 * server or URL home (AGENTS.md §3): it lives only between the click on the
 * board, the timeline or the home composer and the moment Quick create opens.
 */
export const useFrameHandoff = create<HandoffState>()((set) => ({
  pending: EMPTY,
  give: (slot, frame) => {
    set((state) => ({ pending: { ...state.pending, [slot]: frame } }));
  },
  givePrompt: (prompt) => {
    set((state) => ({ pending: { ...state.pending, prompt } }));
  },
  clear: () => {
    set({ pending: EMPTY });
  },
}));

/** The Quick create address that opens frame mode. */
export const FRAME_MODE_HREF = "/create?tab=video&input=frames";
