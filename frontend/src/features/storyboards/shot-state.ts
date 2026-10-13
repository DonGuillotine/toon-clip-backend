import { Check, CircleAlert, Clock, Flag, Loader, Lock, type LucideIcon } from "lucide-react";

import { type ShotState } from "./schema";

type ShotStateMeta = {
  readonly label: string;
  readonly icon: LucideIcon;
  /** Fill on the shot strip. Never the only signal: label and icon go with it. */
  readonly fill: string;
  /** Text tone when the state is called out in words. */
  readonly tone: string;
};

/**
 * One entry per shot state (PRODUCT.md, "Shot states"). Most states are quiet
 * greys; comic texture is kept for the states that mean something is
 * happening: speed lines while generating, screentone once locked.
 *
 * `satisfies Record<ShotState, ...>` makes adding a state a compile error
 * here until it is designed.
 */
export const SHOT_STATE_META = {
  queued: { label: "Queued", icon: Clock, fill: "bg-pending", tone: "text-muted-foreground" },
  generating: {
    label: "Generating",
    icon: Loader,
    fill: "speed-lines animate-speed bg-live [--speed-angle:115deg] [--speed-gap:5px] [--speed-ink:oklch(1_0_0/0.45)] [--speed-weight:1px]",
    tone: "text-live-foreground",
  },
  ready: { label: "Ready", icon: Check, fill: "bg-settled", tone: "text-muted-foreground" },
  flagged: { label: "Flagged", icon: Flag, fill: "bg-flag", tone: "text-flag-foreground" },
  locked: {
    label: "Locked",
    icon: Lock,
    fill: "tone-dots bg-pending [--tone-ink:var(--muted-foreground)] [--tone-size:3px]",
    tone: "text-muted-foreground",
  },
  failed: {
    label: "Failed",
    icon: CircleAlert,
    fill: "bg-destructive",
    tone: "text-destructive-foreground",
  },
} satisfies Record<ShotState, ShotStateMeta>;
