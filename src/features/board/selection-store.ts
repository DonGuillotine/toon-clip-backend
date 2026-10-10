import { create } from "zustand";

type SelectionState = {
  readonly selected: readonly string[];
  /** Click replaces the selection; shift-click adds or removes one. */
  readonly select: (id: string, additive: boolean) => void;
  readonly clear: () => void;
};

export function nextSelection(
  current: readonly string[],
  id: string,
  additive: boolean,
): readonly string[] {
  if (!additive) return current.length === 1 && current[0] === id ? [] : [id];
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

/** Board selection: shared by the canvas, the toolbar and the minimap. */
export const useBoardSelection = create<SelectionState>()((set) => ({
  selected: [],
  select: (id, additive) => {
    set((state) => ({ selected: nextSelection(state.selected, id, additive) }));
  },
  clear: () => {
    set({ selected: [] });
  },
}));
