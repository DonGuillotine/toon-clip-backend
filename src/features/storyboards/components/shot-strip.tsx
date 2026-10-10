import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

import { type ShotState, type ShotSummary } from "../schema";
import { SHOT_STATE_META } from "../shot-state";

/** States worth calling out in the summary line, in priority order. */
const CALL_OUT: readonly ShotState[] = ["failed", "flagged", "generating", "queued"];

/**
 * The storyboard's shots as a strip of film: each segment's width is its
 * duration, its fill and icon are its state.
 */
export function ShotStrip({ shots }: { readonly shots: readonly ShotSummary[] }) {
  const total = shots.reduce((sum, shot) => sum + shot.durationSec, 0);
  const counts = new Map<ShotState, number>();
  for (const shot of shots) counts.set(shot.state, (counts.get(shot.state) ?? 0) + 1);

  const callOuts = CALL_OUT.flatMap((state) => {
    const count = counts.get(state);
    return count === undefined ? [] : [`${count} ${SHOT_STATE_META[state].label.toLowerCase()}`];
  });

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex h-6 gap-1" aria-label="Shots">
        {shots.map((shot, index) => {
          const meta = SHOT_STATE_META[shot.state];
          const Icon = meta.icon;
          return (
            <li
              key={shot.id}
              style={{ flexGrow: shot.durationSec }}
              className={cn(
                "flex min-w-6 basis-0 items-center justify-center rounded-sm border-2 border-ink",
                meta.segment,
              )}
            >
              <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              <span className="sr-only">
                Shot {index + 1}, {meta.label}, {shot.durationSec} seconds
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink-soft">
        <span className="tabular">
          {shots.length} {shots.length === 1 ? "shot" : "shots"} · {formatDuration(total)}
        </span>
        {callOuts.length > 0 ? <span> · {callOuts.join(" · ")}</span> : null}
      </p>
    </div>
  );
}
