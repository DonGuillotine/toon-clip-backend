import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import { type ShotState, type ShotSummary } from "../schema";
import { SHOT_STATE_META } from "../shot-state";

/** States called out under the strip, in priority order. */
const CALL_OUT: readonly ShotState[] = ["failed", "flagged", "generating"];

/**
 * A storyboard's shots as a thin strip: each segment's width is its duration,
 * its fill is its state. The words underneath carry the same facts.
 */
export function ShotStrip({ shots }: { readonly shots: readonly ShotSummary[] }) {
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
            className={cn("basis-0 rounded-full", SHOT_STATE_META[shot.state].fill)}
          >
            <span className="sr-only">
              Shot {index + 1}, {SHOT_STATE_META[shot.state].label}, {shot.durationSec} seconds
            </span>
          </li>
        ))}
      </ol>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular">
          {shots.length} {shots.length === 1 ? "shot" : "shots"} · {formatDuration(total)}
        </span>
        {CALL_OUT.map((state) => {
          const count = counts.get(state);
          if (count === undefined) return null;
          const meta = SHOT_STATE_META[state];
          const Icon = meta.icon;
          return (
            <span
              key={state}
              className={cn("inline-flex items-center gap-1 font-medium", meta.tone)}
            >
              <Icon aria-hidden="true" className="size-3" />
              {count} {meta.label.toLowerCase()}
            </span>
          );
        })}
      </p>
    </div>
  );
}
