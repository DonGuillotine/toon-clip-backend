"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Columns2,
  Coins,
  Copy,
  LayoutDashboard,
  PenLine,
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

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sendShotMutation } from "@/features/board/mutations";
import { FRAME_MODE_HREF, useFrameHandoff } from "@/features/create/frame-handoff";
import { artFrameUrl } from "@/lib/art-svg";
import { formatCredits } from "@/lib/format";

import { continuityNotes } from "../continuity";
import {
  type FrameRef,
  type GenerationKind,
  type ShotAction,
  type StoryboardDetail,
} from "../schema";
import {
  frameChoices,
  placeShots,
  selectedTake,
  shotAbilities,
  type PlacedShot,
} from "../timeline";
import { CompareTakesDialog } from "./compare-takes-dialog";
import {
  ContinuityNotes,
  EditPromptDialog,
  FrameCard,
  ShotCast,
  TrimControl,
} from "./inspector-extras";
import { ArtThumb, ShotStateLabel } from "./shot-bits";
import { useShotProgress } from "./timeline-tracks";

export type InspectorProps = {
  readonly storyboardId: string;
  readonly detail: StoryboardDetail;
  readonly item: PlacedShot;
  readonly canMerge: boolean;
  /** API-quoted cost of a regenerate, `null` while it loads or if it failed. */
  readonly regenerateCost: number | null;
  readonly onAction: (action: ShotAction) => void;
  readonly onGenerate: (kind: GenerationKind, withNotes: boolean) => void;
  readonly onSplit: () => void;
};

/** Everything about one shot: state, actions, frames and take history. */
export function ShotInspector({
  storyboardId,
  detail,
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
  const [comparing, setComparing] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const sendToBoard = useMutation(sendShotMutation(queryClient, storyboardId));
  const giveFrame = useFrameHandoff((state) => state.give);
  const choices = frameChoices(detail, shot.id);
  const notes = continuityNotes(placeShots(detail)).filter((note) => note.shotId === shot.id);
  const take = selectedTake(shot);

  const openFrameInCreate = (slot: "first" | "last") => (frame: FrameRef) => {
    giveFrame(slot, { name: frame.label, url: artFrameUrl(frame.art, frame.label) });
    router.push(FRAME_MODE_HREF);
  };

  const send = () => {
    sendToBoard.mutate(
      {
        shotId: shot.id,
        label: `Shot ${String(item.number)}`,
        art: take?.art ?? "burst",
        state: shot.state,
        durationSec: shot.durationSec,
      },
      {
        onSuccess: (result) => {
          toast(result.message, {
            action: {
              label: "Open board",
              onClick: () => {
                router.push(`/storyboards/${storyboardId}/board`);
              },
            },
          });
        },
        onError: () => {
          toast.error("The shot did not reach the board. Nothing changed; try again.");
        },
      },
    );
  };

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

          <ShotCast characterIds={shot.characterIds} />

          <div className="grid grid-cols-2 gap-1">
            <FrameCard
              label="First frame"
              frame={shot.firstFrame}
              choices={choices}
              editable={can.edit}
              onChange={(frame) => {
                onAction({ type: "setFrame", shotId: shot.id, slot: "first", frame });
              }}
              onOpenInCreate={openFrameInCreate("first")}
            />
            <FrameCard
              label="Last frame"
              frame={shot.lastFrame}
              choices={choices}
              editable={can.edit}
              onChange={(frame) => {
                onAction({ type: "setFrame", shotId: shot.id, slot: "last", frame });
              }}
              onOpenInCreate={openFrameInCreate("last")}
            />
          </div>
          {can.edit && can.regenerate ? (
            <p className="px-3 text-xs text-muted-foreground">
              Changed a frame or the prompt? Regenerate to make a take that uses it.
            </p>
          ) : null}

          <TrimControl
            key={`${shot.id}_${String(shot.durationSec)}`}
            durationSec={shot.durationSec}
            editable={can.edit}
            onTrim={(durationSec) => {
              onAction({ type: "trim", shotId: shot.id, durationSec });
            }}
          />

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
              disabled={!can.edit}
              onClick={() => {
                setEditingPrompt(true);
              }}
            >
              <PenLine aria-hidden="true" /> Edit prompt
            </Button>
            <Button
              variant="secondary"
              disabled={shot.takes.length < 2}
              onClick={() => {
                setComparing(true);
              }}
            >
              <Columns2 aria-hidden="true" /> Compare takes
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
            <Button variant="secondary" disabled={sendToBoard.isPending} onClick={send}>
              <LayoutDashboard aria-hidden="true" /> Send to Board
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/storyboards/${storyboardId}/board`}>Open board</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Continuity"
        titleId="continuity-heading"
        count={notes.length}
        description="Suggestions only. Nothing here stops a generation."
      >
        <ContinuityNotes
          notes={notes}
          editable={can.edit}
          onApply={(note) => {
            onAction({ type: "editPrompt", shotId: shot.id, prompt: note.suggestedPrompt });
          }}
        />
      </Section>

      <CompareTakesDialog
        open={comparing}
        onOpenChange={setComparing}
        shotNumber={item.number}
        takes={shot.takes}
        selectedTakeId={shot.selectedTakeId}
        locked={shot.state === "locked"}
        onSelect={(takeId) => {
          onAction({ type: "selectTake", shotId: shot.id, takeId });
        }}
      />
      <EditPromptDialog
        open={editingPrompt}
        onOpenChange={setEditingPrompt}
        shotNumber={item.number}
        prompt={shot.prompt}
        characterIds={shot.characterIds}
        onSave={(prompt) => {
          onAction({ type: "editPrompt", shotId: shot.id, prompt });
        }}
      />

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
