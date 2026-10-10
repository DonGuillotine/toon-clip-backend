import { CircleAlert, Flag, Loader } from "lucide-react";

import { type ShotState, type ShotSummary } from "@/features/storyboards/schema";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Segment fills. Most states are quiet greys; the comic textures are kept
 * for the states that mean something is happening or needs a hand:
 * speed lines while generating, screentone once locked.
 */
const SEGMENT = {
  queued: "bg-tone-2",
  generating:
    "speed-lines animate-speed bg-sky [--speed-angle:115deg] [--speed-gap:5px] [--speed-ink:oklch(1_0_0/0.45)] [--speed-weight:1px]",
  ready: "bg-ink-mute/45",
  flagged: "bg-pop",
  locked: "tone-dots bg-tone-2 [--tone-ink:var(--ink-soft)] [--tone-size:3px]",
  failed: "bg-fail",
} satisfies Record<ShotState, string>;

/** States called out under the strip, each with an icon so colour is never the only signal. */
const CALL_OUT = [
  { state: "failed", icon: CircleAlert, tone: "text-fail" },
  { state: "flagged", icon: Flag, tone: "text-pop-ink" },
  { state: "generating", icon: Loader, tone: "text-sky-ink" },
] satisfies readonly { state: ShotState; icon: typeof Flag; tone: string }[];

export function CalmShotStrip({ shots }: { readonly shots: readonly ShotSummary[] }) {
  const total = shots.reduce((sum, shot) => sum + shot.durationSec, 0);
  const counts = new Map<ShotState, number>();
  for (const shot of shots) counts.set(shot.state, (counts.get(shot.state) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex h-1.5 gap-0.5" aria-label="Shots">
        {shots.map((shot, index) => (
          <li
            key={shot.id}
            style={{ flexGrow: shot.durationSec }}
            className={cn("basis-0 rounded-full", SEGMENT[shot.state])}
          >
            <span className="sr-only">
              Shot {index + 1}, {SHOT_STATE_META[shot.state].label}, {shot.durationSec} seconds
            </span>
          </li>
        ))}
      </ol>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
        <span className="tabular">
          {shots.length} {shots.length === 1 ? "shot" : "shots"} · {formatDuration(total)}
        </span>
        {CALL_OUT.map(({ state, icon: Icon, tone }) => {
          const count = counts.get(state);
          if (count === undefined) return null;
          return (
            <span key={state} className={cn("inline-flex items-center gap-1 font-medium", tone)}>
              <Icon aria-hidden="true" className="size-3" />
              {count} {SHOT_STATE_META[state].label.toLowerCase()}
            </span>
          );
        })}
      </p>
    </div>
  );
}
