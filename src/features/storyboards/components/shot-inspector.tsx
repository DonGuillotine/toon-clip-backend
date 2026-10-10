"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Coins,
  Copy,
  Flag,
  FlagOff,
  Forward,
  Lock,
  LockOpen,
  Merge,
  NotebookPen,
  RefreshCw,
  Scissors,
} from "lucide-react";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCredits } from "@/lib/format";

import { type FrameRef, type GenerationKind, type ShotAction } from "../schema";
import { shotAbilities, type PlacedShot } from "../timeline";
import { ArtThumb, ShotStateLabel } from "./shot-bits";
import { useShotProgress } from "./timeline-tracks";

export type InspectorProps = {
  readonly storyboardId: string;
  readonly item: PlacedShot;
  readonly canMerge: boolean;
  /** API-quoted cost of a regenerate, `null` while it loads or if it failed. */
  readonly regenerateCost: number | null;
  readonly onAction: (action: ShotAction) => void;
  readonly onGenerate: (kind: GenerationKind, withNotes: boolean) => void;
  readonly onSplit: () => void;
};

function Frame({ label, frame }: { readonly label: string; readonly frame: FrameRef | null }) {
  return (
    <div className="flex items-center gap-1 rounded-sm bg-card p-1">
      {frame ? (
        <ArtThumb art={frame.art} />
      ) : (
        <span className="block h-12.5 w-20 shrink-0 rounded-xs bg-muted" />
      )}
      <span className="flex min-w-0 flex-col ps-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="truncate text-xs text-muted-foreground">
          {frame ? frame.label : "None set"}
        </span>
      </span>
    </div>
  );
}

/** Everything about one shot: state, actions, frames and take history. */
export function ShotInspector({
  storyboardId,
  item,
  canMerge,
  regenerateCost,
  onAction,
  onGenerate,
  onSplit,
}: InspectorProps) {
  const { shot } = item;
  const can = shotAbilities(shot);
  const progress = useShotProgress(storyboardId, shot);
  const takes = [...shot.takes].reverse();

  return (
    <div className="flex flex-col gap-4">
      <Section
        title={`Shot ${String(item.number)}`}
        titleId="inspector-heading"
        description={`${item.sheetTitle} · ${String(shot.durationSec)} seconds`}
        action={<ShotStateLabel state={shot.state} />}
      >
        <div className="flex flex-col gap-1">
          <div aria-live="polite" className="flex flex-col gap-2 rounded-sm bg-card p-3">
            {shot.state === "failed" ? (
              <>
                <p className="text-sm">{shot.reason}</p>
                <p className="tabular text-xs text-muted-foreground">
                  {formatCredits(shot.creditsRefunded)} credits refunded.
                </p>
              </>
            ) : shot.state === "queued" ? (
              <p className="text-sm text-muted-foreground">Waiting for a free generator.</p>
            ) : shot.state === "generating" ? (
              <>
                <p className="tabular text-sm text-muted-foreground">
                  Generating a new take{progress === null ? "" : `, ${String(progress)}%`}
                </p>
                <Progress value={progress ?? 0} aria-label="Generation progress" />
              </>
            ) : null}
            <p className="text-sm">{shot.prompt}</p>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <Frame label="First frame" frame={shot.firstFrame} />
            <Frame label="Last frame" frame={shot.lastFrame} />
          </div>

          <div className="flex flex-wrap gap-1 rounded-sm bg-card p-1">
            <Button
              disabled={!can.regenerate}
              onClick={() => {
                onGenerate("regenerate", false);
              }}
            >
              <RefreshCw aria-hidden="true" />
              {shot.state === "failed" ? "Retry" : "Regenerate"}
              {regenerateCost === null ? null : (
                <span className="tabular inline-flex items-center gap-1 opacity-80">
                  <Coins aria-hidden="true" className="size-3.5" />
                  {formatCredits(regenerateCost)}
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              disabled={!can.regenerate}
              onClick={() => {
                onGenerate("regenerate", true);
              }}
            >
              <NotebookPen aria-hidden="true" /> With notes
            </Button>
            <Button
              variant="secondary"
              disabled={!can.flag}
              onClick={() => {
                onAction({ type: "flag", shotId: shot.id, flagged: shot.state !== "flagged" });
              }}
            >
              {shot.state === "flagged" ? (
                <>
                  <FlagOff aria-hidden="true" /> Clear flag
                </>
              ) : (
                <>
                  <Flag aria-hidden="true" /> Flag
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              disabled={!can.lock}
              onClick={() => {
                onAction({ type: "lock", shotId: shot.id, locked: shot.state !== "locked" });
              }}
            >
              {shot.state === "locked" ? (
                <>
                  <LockOpen aria-hidden="true" /> Unlock
                </>
              ) : (
                <>
                  <Lock aria-hidden="true" /> Lock
                </>
              )}
            </Button>
            <Button variant="secondary" disabled={!can.edit} onClick={onSplit}>
              <Scissors aria-hidden="true" /> Split at playhead
            </Button>
            <Button
              variant="secondary"
              disabled={shot.state === "queued" || shot.state === "generating"}
              onClick={() => {
                onAction({ type: "duplicate", shotId: shot.id });
              }}
            >
              <Copy aria-hidden="true" /> Duplicate
            </Button>
            <Button
              variant="secondary"
              disabled={!can.edit || !canMerge}
              onClick={() => {
                onAction({ type: "merge", shotId: shot.id });
              }}
            >
              <Merge aria-hidden="true" /> Merge with next
            </Button>
            <Button
              variant="secondary"
              disabled={!can.continueFrom}
              onClick={() => {
                onGenerate("continue", false);
              }}
            >
              <Forward aria-hidden="true" /> Continue from here
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Takes"
        titleId="takes-heading"
        count={shot.takes.length}
        description="Every take is kept. Pick the one the timeline uses."
      >
        {takes.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            The first take shows up here when it finishes.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {takes.map((take) => {
              const isSelected = take.id === shot.selectedTakeId;
              return (
                <li key={take.id} className="flex gap-1 rounded-sm bg-card p-1">
                  <ArtThumb art={take.art} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1 p-1 ps-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">Take {take.number}</span>
                      {isSelected ? (
                        <Badge variant="spot">Selected</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={shot.state === "locked"}
                          onClick={() => {
                            onAction({ type: "selectTake", shotId: shot.id, takeId: take.id });
                          }}
                        >
                          Use this take
                        </Button>
                      )}
                    </div>
                    <span className="tabular text-xs text-muted-foreground">
                      {formatDistanceToNowStrict(new Date(take.createdAt), { addSuffix: true })} ·{" "}
                      {formatCredits(take.credits)} credits
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {take.settings.model}, {take.settings.resolution}, seed {take.settings.seed}
                    </span>
                    {take.notes === null ? null : (
                      <span className="text-xs">Notes: {take.notes}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
