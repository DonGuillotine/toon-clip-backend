import { CircleAlert, Clock, Flag, Loader, Lock, type LucideIcon, Check } from "lucide-react";

import { type ShotState } from "./schema";

type ShotStateMeta = {
  readonly label: string;
  readonly icon: LucideIcon;
  /** Segment fill on the shot strip. Never the only signal: icon and label go with it. */
  readonly segment: string;
};

/**
 * One entry per shot state. `satisfies Record<ShotState, ...>` makes adding a
 * state a compile error here until it is designed.
 */
export const SHOT_STATE_META = {
  queued: { label: "Queued", icon: Clock, segment: "bg-tone-1 text-ink-soft" },
  generating: {
    label: "Generating",
    icon: Loader,
    segment: "speed-lines animate-speed bg-sky text-ink [--speed-angle:115deg] [--speed-gap:7px] [--speed-ink:var(--ink-faint)]",
  },
  ready: { label: "Ready", icon: Check, segment: "bg-sheet text-ink" },
  flagged: { label: "Flagged", icon: Flag, segment: "bg-pop text-sheet" },
  locked: {
    label: "Locked",
    icon: Lock,
    segment: "tone-dots bg-sheet text-ink [--tone-ink:var(--tone-3)] [--tone-size:5px]",
  },
  failed: { label: "Failed", icon: CircleAlert, segment: "bg-ink text-sheet" },
} satisfies Record<ShotState, ShotStateMeta>;
