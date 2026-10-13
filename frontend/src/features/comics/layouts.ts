import { type ComicLayout } from "./schema";

export type LayoutMeta = {
  readonly label: string;
  readonly description: string;
  /**
   * Grid placement per slot on a 6 by 6 page grid, in reading order. The
   * classes are literals so Tailwind sees them.
   */
  readonly slots: readonly string[];
};

/**
 * Page templates from 1 to 6 panels (spec 15, "Comic mode layout"). Every
 * template tiles the full 6 by 6 grid, so a page never has a hole.
 */
export const LAYOUTS = {
  splash: {
    label: "Splash",
    description: "One full-page panel for a big reveal.",
    slots: ["col-span-6 row-span-6"],
  },
  "two-tier": {
    label: "Two tiers",
    description: "Two wide panels, top and bottom.",
    slots: ["col-span-6 row-span-3", "col-span-6 row-span-3"],
  },
  "three-tier": {
    label: "Three tiers",
    description: "Three wide strips, read top to bottom.",
    slots: ["col-span-6 row-span-2", "col-span-6 row-span-2", "col-span-6 row-span-2"],
  },
  "feature-three": {
    label: "Feature and two",
    description: "A large establishing panel over two beats.",
    slots: ["col-span-6 row-span-4", "col-span-3 row-span-2", "col-span-3 row-span-2"],
  },
  "grid-four": {
    label: "Four grid",
    description: "Four equal panels, even pacing.",
    slots: [
      "col-span-3 row-span-3",
      "col-span-3 row-span-3",
      "col-span-3 row-span-3",
      "col-span-3 row-span-3",
    ],
  },
  "five-beat": {
    label: "Five beats",
    description: "Two, one wide, two: a pause in the middle.",
    slots: [
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
      "col-span-6 row-span-2",
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
    ],
  },
  "grid-six": {
    label: "Six grid",
    description: "Six equal panels for a fast sequence.",
    slots: [
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
      "col-span-3 row-span-2",
    ],
  },
} satisfies Record<ComicLayout, LayoutMeta>;

export function panelCount(layout: ComicLayout): number {
  return LAYOUTS[layout].slots.length;
}

/** Grid area for slot `index`, or a plain cell if a page has more panels than slots. */
export function slotClass(layout: ComicLayout, index: number): string {
  return LAYOUTS[layout].slots[index] ?? "col-span-3 row-span-2";
}

/** Cell count a slot covers, read from its classes. Used to check a layout tiles. */
export function slotArea(slot: string): number {
  const cols = /col-span-(\d)/.exec(slot)?.[1];
  const rows = /row-span-(\d)/.exec(slot)?.[1];
  return Number(cols ?? 0) * Number(rows ?? 0);
}
