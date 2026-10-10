import { create } from "zustand";

/**
 * Whether the top-up dialog is open, and why. Cross-cutting client state with
 * no URL or server home: any "Top up" button or insufficient-credits notice
 * anywhere in the app opens the one dialog mounted in the shell.
 */
type TopUpState = {
  readonly open: boolean;
  /** Credits the action that sent the user here needs, when known. */
  readonly needed: number | null;
  readonly openTopUp: (needed?: number) => void;
  readonly setOpen: (open: boolean) => void;
};

export const useTopUpStore = create<TopUpState>()((set) => ({
  open: false,
  needed: null,
  openTopUp: (needed) => {
    set({ open: true, needed: needed ?? null });
  },
  setOpen: (open) => {
    set(open ? { open } : { open, needed: null });
  },
}));

/** Open the top-up dialog from outside React (a mutation's onError). */
export function openTopUp(needed?: number): void {
  useTopUpStore.getState().openTopUp(needed);
}
