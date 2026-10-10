import { type Transition } from "motion/react";

/**
 * The motion scale. Components import from here; they never author a curve
 * or a duration inline. Values mirror the CSS custom properties in
 * `globals.css` so CSS transitions and Motion springs agree.
 */

export const duration = {
  fast: 0.15,
  base: 0.22,
  slow: 0.4,
} satisfies Record<string, number>;

/** Strong ease-out: fast start, soft landing. For anything entering. */
export const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

export const transition = {
  base: { duration: duration.base, ease: easeOut },
  slow: { duration: duration.slow, ease: easeOut },
  /** A springy settle for playful, physical moments. */
  bounce: { type: "spring", stiffness: 420, damping: 18, mass: 0.8 },
} satisfies Record<string, Transition>;
