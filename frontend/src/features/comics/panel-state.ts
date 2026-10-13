import { Check, CircleAlert, CircleDashed, Clock, Loader, type LucideIcon } from "lucide-react";

import { SHOT_STATE_META } from "@/features/storyboards/shot-state";

import { type BubbleKind, type ComicExportStatus, type PanelState } from "./schema";

type PanelStateMeta = {
  readonly label: string;
  readonly icon: LucideIcon;
  /** Text tone when the state is called out in words. Never the only signal. */
  readonly tone: string;
  readonly badge: "default" | "live" | "destructive";
};

/**
 * One entry per panel state. Generating and failed reuse the shot strip's
 * marks, so a panel and a shot in the same state read the same.
 */
export const PANEL_STATE_META = {
  empty: {
    label: "Not drawn yet",
    icon: CircleDashed,
    tone: "text-muted-foreground",
    badge: "default",
  },
  queued: {
    label: SHOT_STATE_META.queued.label,
    icon: Clock,
    tone: SHOT_STATE_META.queued.tone,
    badge: "default",
  },
  generating: {
    label: SHOT_STATE_META.generating.label,
    icon: Loader,
    tone: SHOT_STATE_META.generating.tone,
    badge: "live",
  },
  ready: {
    label: SHOT_STATE_META.ready.label,
    icon: Check,
    tone: SHOT_STATE_META.ready.tone,
    badge: "default",
  },
  failed: {
    label: SHOT_STATE_META.failed.label,
    icon: CircleAlert,
    tone: SHOT_STATE_META.failed.tone,
    badge: "destructive",
  },
} satisfies Record<PanelState, PanelStateMeta>;

export const BUBBLE_KIND_META = {
  speech: { label: "Speech", placeholder: "What they say" },
  thought: { label: "Thought", placeholder: "What they think" },
  caption: { label: "Caption", placeholder: "Narration" },
} satisfies Record<BubbleKind, { label: string; placeholder: string }>;

export const EXPORT_STATUS_META = {
  preparing: { label: "Preparing", icon: Clock, badge: "default" },
  rendering: { label: "Rendering", icon: Loader, badge: "live" },
  ready: { label: "Ready", icon: Check, badge: "default" },
  failed: { label: "Failed", icon: CircleAlert, badge: "destructive" },
} satisfies Record<
  ComicExportStatus,
  { label: string; icon: LucideIcon; badge: "default" | "live" | "destructive" }
>;
