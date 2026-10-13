import { type Transition } from "motion/react";

/**
 * The motion scale (DESIGN.md §6). Components import from here; they never
 * author a curve or a duration inline. Values mirror `globals.css`.
 */

export const duration = {
  press: 0.14,
  tooltip: 0.15,
  menu: 0.18,
  overlay: 0.26,
  slow: 0.4,
} satisfies Record<string, number>;

/** Strong ease-out: for anything entering or leaving. */
export const easeOutStrong: [number, number, number, number] = [0.23, 1, 0.32, 1];
/** Strong ease-in-out: for things moving while on screen. */
export const easeInOutStrong: [number, number, number, number] = [0.77, 0, 0.175, 1];

export const transition = {
  menu: { duration: duration.menu, ease: easeOutStrong },
  overlay: { duration: duration.overlay, ease: easeOutStrong },
  /** Apple-style spring. Bounce stays at or under 0.2: a tool that wobbles reads as unserious. */
  spring: { type: "spring", duration: 0.5, bounce: 0.2 },
} satisfies Record<string, Transition>;
