"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PanelBottomOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { accountQuery } from "@/features/account/queries";
import { ApiError } from "@/lib/api/client";
import { formatDuration } from "@/lib/format";
import { keys } from "@/lib/query/keys";

import { useGenerate, useShotAction } from "../mutations";
import { shotJobQuery, shotQuoteQuery, storyboardDetailQuery } from "../queries";
import { type ShotAction, type StoryboardDetail } from "../schema";
import { commandFor, type TimelineCommand } from "../shortcuts";
import {
  CONFIRM_ABOVE_CREDITS,
  MIN_SHOT_SEC,
  placeShots,
  shotAbilities,
  shuttle,
  totalDuration,
  type PlacedShot,
} from "../timeline";
import { useTimelineStore } from "../timeline-store";
import { GenerateDialog, type GenerateRequestState } from "./generate-dialog";
import { ShotInspector } from "./shot-inspector";
import { activeJobId, ShotStrip, TimelinePreview, TimelineTracks } from "./timeline-tracks";
import { TimelineToolbar } from "./timeline-toolbar";

export function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading the timeline">
      <Skeleton className="h-8 w-64 rounded-full" />
      <Skeleton className="h-11 rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-8">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="hidden h-96 rounded-xl xl:col-span-4 xl:block" />
      </div>
    </div>
  );
}

/** Polls one generation job and refreshes the storyboard each time it moves on. */
function JobWatcher({
  storyboardId,
  jobId,
}: {
  readonly storyboardId: string;
  readonly jobId: string;
}) {
  const queryClient = useQueryClient();
  const job = useQuery(shotJobQuery(storyboardId, jobId));
  const status = job.data?.status;
  useEffect(() => {
    if (status === undefined) return;
    void queryClient.invalidateQueries({ queryKey: keys.timeline.detail(storyboardId) });
    if (status === "ready") toast("A new take is ready.");
    if (status === "failed") toast.error("A shot failed. Its credits were refunded.");
  }, [status, storyboardId, queryClient]);
  return null;
}

/** Moves the playhead while the shuttle rate is not zero. */
function usePlayback(total: number) {
  const rate = useTimelineStore((state) => state.rate);
  useEffect(() => {
    if (rate === 0) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      const { playheadSec, seek, setRate } = useTimelineStore.getState();
      const next = playheadSec + ((now - last) / 1000) * rate;
      last = now;
      if (next >= total || next <= 0) {
        seek(Math.min(Math.max(next, 0), total));
        setRate(0);
        return;
      }
      seek(next);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [rate, total]);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("input, textarea, select, [role='dialog'], [role='menu']")) return true;
  return false;
}

/** The timeline editor (spec 7.5). Loads the storyboard, then hands off to the editor. */
export function TimelineEditor({ id }: { readonly id: string }) {
  const detail = useQuery(storyboardDetailQuery(id));
  if (detail.isPending) return <TimelineSkeleton />;
  if (detail.isError) {
    if (detail.error instanceof ApiError && detail.error.status === 404) notFound();
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <h1 className="text-xl font-semibold tracking-tight">The timeline did not load.</h1>
        <p className="text-muted-foreground">Nothing you made is lost. Try loading it again.</p>
        <Button variant="secondary" onClick={() => void detail.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }
  return <Editor detail={detail.data} />;
}

function Editor({ detail }: { readonly detail: StoryboardDetail }) {
  const [shotParam, setShotParam] = useQueryState("shot", parseAsString);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [generateRequest, setGenerateRequest] = useState<GenerateRequestState | null>(null);

  const open = useTimelineStore((state) => state.open);
  const rate = useTimelineStore((state) => state.rate);
  const past = useTimelineStore((state) => state.past);
  const future = useTimelineStore((state) => state.future);
  const undone = useTimelineStore((state) => state.undone);
  const redone = useTimelineStore((state) => state.redone);

  useEffect(() => {
    open(detail.id);
  }, [open, detail.id]);

  const placed = placeShots(detail);
  const total = totalDuration(detail);
  usePlayback(total);

  const selected = placed.find((item) => item.shot.id === shotParam) ?? placed[0];
  const action = useShotAction(detail.id);
  const generate = useGenerate(detail.id);
  const account = useQuery(accountQuery);
  const quote = useQuery({
    ...shotQuoteQuery(detail.id, selected?.shot.id ?? "", "regenerate"),
    enabled: selected !== undefined,
  });

  const select = (item: PlacedShot) => {
    void setShotParam(item.shot.id);
    useTimelineStore.getState().seek(item.startSec);
  };

  const run = (shotAction: ShotAction) => {
    action.mutate(shotAction);
  };

  const nextInSheet = (item: PlacedShot): boolean => {
    const sheet = detail.sheets.find((candidate) => candidate.id === item.sheetId);
    const index = sheet?.shots.findIndex((shot) => shot.id === item.shot.id) ?? -1;
    return sheet !== undefined && index >= 0 && index < sheet.shots.length - 1;
  };

  const split = () => {
    if (!selected) return;
    const offset = useTimelineStore.getState().playheadSec - selected.startSec;
    if (offset < MIN_SHOT_SEC || selected.shot.durationSec - offset < MIN_SHOT_SEC) {
      toast("Move the playhead at least a second into the selected shot to split it.");
      return;
    }
    run({ type: "split", shotId: selected.shot.id, atSec: offset });
  };

  const requestGenerate = (kind: GenerateRequestState["kind"], withNotes: boolean) => {
    if (!selected) return;
    const cost = quote.data?.credits;
    const balance = account.data?.credits;
    // The fast path: a plain regenerate under the threshold, cost already shown.
    if (
      kind === "regenerate" &&
      !withNotes &&
      cost !== undefined &&
      cost <= CONFIRM_ABOVE_CREDITS &&
      balance !== undefined &&
      cost <= balance
    ) {
      generate.mutate({ shotId: selected.shot.id, kind, notes: null, quotedCredits: cost });
      return;
    }
    setGenerateRequest({ shotId: selected.shot.id, shotNumber: selected.number, kind, withNotes });
  };

  const undo = () => {
    const entry = past.at(-1);
    if (!entry) return;
    action.mutate({ type: "restore", revision: entry.before }, { onSuccess: undone });
  };
  const redo = () => {
    const entry = future.at(-1);
    if (!entry) return;
    action.mutate({ type: "restore", revision: entry.after }, { onSuccess: redone });
  };

  const can = selected ? shotAbilities(selected.shot) : null;

  const handle = (command: TimelineCommand) => {
    const store = useTimelineStore.getState();
    switch (command) {
      case "play":
        if (store.rate !== 0) store.setRate(0);
        else {
          if (store.playheadSec >= total) store.seek(0);
          store.setRate(1);
        }
        return;
      case "back":
        store.setRate(shuttle(store.rate, "j"));
        return;
      case "pause":
        store.setRate(0);
        return;
      case "forward":
        if (store.rate === 0 && store.playheadSec >= total) store.seek(0);
        store.setRate(shuttle(store.rate, "l"));
        return;
      case "split":
        split();
        return;
      case "flag":
        if (selected && can?.flag) {
          run({
            type: "flag",
            shotId: selected.shot.id,
            flagged: selected.shot.state !== "flagged",
          });
        }
        return;
      case "lock":
        if (selected && can?.lock) {
          run({ type: "lock", shotId: selected.shot.id, locked: selected.shot.state !== "locked" });
        }
        return;
      case "regenerate":
        if (can?.regenerate) requestGenerate("regenerate", false);
        return;
      case "undo":
        undo();
        return;
      case "redo":
        redo();
        return;
      case "board":
        // Follow the toolbar link, so the shortcut and the button go to one place.
        document.querySelector<HTMLAnchorElement>("[data-board-link]")?.click();
        return;
    }
  };

  // Re-bound every render so the handler always sees the current shot.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || isTypingTarget(event.target)) return;
      const command = commandFor(event);
      if (command === null) return;
      event.preventDefault();
      handle(command);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const inspector = selected ? (
    <ShotInspector
      storyboardId={detail.id}
      item={selected}
      canMerge={nextInSheet(selected)}
      regenerateCost={quote.data?.credits ?? null}
      onAction={run}
      onGenerate={requestGenerate}
      onSplit={split}
    />
  ) : (
    <Card className="p-6 text-sm text-muted-foreground">
      This storyboard has no shots yet. They show up here as they generate.
    </Card>
  );

  const activeJobs = placed.flatMap((item) => {
    const jobId = activeJobId(item.shot);
    return jobId === null ? [] : [jobId];
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{detail.title}</h1>
        <p className="tabular text-sm text-muted-foreground">
          {detail.style} · {detail.aspectRatio} · {formatDuration(total)}
        </p>
      </header>

      <TimelineToolbar
        storyboardId={detail.id}
        playing={rate !== 0}
        can={{
          split: can?.edit ?? false,
          merge: (can?.edit ?? false) && selected !== undefined && nextInSheet(selected),
          flag: can?.flag ?? false,
          lock: can?.lock ?? false,
          undo: past.length > 0 && !action.isPending,
          redo: future.length > 0 && !action.isPending,
        }}
        undoLabel={past.at(-1)?.label ?? null}
        redoLabel={future.at(-1)?.label ?? null}
        onPlay={() => {
          handle("play");
        }}
        onSplit={split}
        onMerge={() => {
          if (selected) run({ type: "merge", shotId: selected.shot.id });
        }}
        onFlag={() => {
          handle("flag");
        }}
        onLock={() => {
          handle("lock");
        }}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-8">
          <TimelinePreview detail={detail} />
          <TimelineTracks
            detail={detail}
            selectedId={selected?.shot.id ?? null}
            onSelect={select}
          />
          <ShotStrip detail={detail} selectedId={selected?.shot.id ?? null} onSelect={select} />
          {selected ? (
            <Button
              variant="secondary"
              className="h-11 xl:hidden"
              onClick={() => {
                setSheetOpen(true);
              }}
            >
              <PanelBottomOpen aria-hidden="true" /> Shot {selected.number} details
            </Button>
          ) : null}
        </div>
        <aside aria-label="Shot inspector" className="hidden min-w-0 xl:col-span-4 xl:block">
          {inspector}
        </aside>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-3/4 overflow-y-auto bg-background p-4 xl:hidden">
          <SheetTitle className="sr-only">Shot details</SheetTitle>
          <SheetDescription className="sr-only">
            State, actions and take history for the selected shot.
          </SheetDescription>
          {inspector}
        </SheetContent>
      </Sheet>

      <GenerateDialog
        storyboardId={detail.id}
        request={generateRequest}
        onClose={() => {
          setGenerateRequest(null);
        }}
        onConfirm={({ notes, credits }) => {
          if (!generateRequest) return;
          generate.mutate({
            shotId: generateRequest.shotId,
            kind: generateRequest.kind,
            notes,
            quotedCredits: credits,
          });
          setGenerateRequest(null);
        }}
      />

      {activeJobs.map((jobId) => (
        <JobWatcher key={jobId} storyboardId={detail.id} jobId={jobId} />
      ))}
    </div>
  );
}
