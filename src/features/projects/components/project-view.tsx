"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowLeft, Download, Flag, Keyboard, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { type RefObject, useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { LoadError } from "@/components/load-state";
import { Card, Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { catalogQuery } from "@/features/catalog/queries";
import { CostNotice, useCanAfford } from "@/features/credits/components/cost-notice";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { ApiError, apiErrorDetail, newIdempotencyKey } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { usePatchShot, useReviseShot } from "../mutations";
import { projectQuery } from "../queries";
import { type Project, type Shot } from "../schema";
import { isTypingTarget, PROJECT_SHORTCUTS, projectCommandFor } from "../shortcuts";
import { formatSeconds, selectedTake, shotState, takeName, type LiveShotState } from "../shots";
import { TakeFrame } from "./project-art";

const BADGE_VARIANT = {
  ready: "default",
  flagged: "flag",
  locked: "default",
} satisfies Record<LiveShotState, "default" | "flag">;

function StateBadge({ state }: { readonly state: LiveShotState }) {
  const meta = SHOT_STATE_META[state];
  return (
    <Badge variant={BADGE_VARIANT[state]}>
      <meta.icon aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

/** A project: watch each shot, choose takes, flag, lock, revise, export. */
export function ProjectView({ projectId }: { readonly projectId: string }) {
  const project = useQuery(projectQuery(projectId));

  if (project.isPending) return <ProjectSkeleton />;
  if (project.isError) {
    if (project.error instanceof ApiError && project.error.status === 404) notFound();
    return (
      <Card>
        <LoadError onRetry={() => void project.refetch()}>This project did not load.</LoadError>
      </Card>
    );
  }
  return <Editor project={project.data} />;
}

export function ProjectSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-16 w-full max-w-md rounded-md" />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl lg:col-span-4" />
      </div>
    </div>
  );
}

function Editor({ project }: { readonly project: Project }) {
  const catalog = useQuery(catalogQuery);
  const [shotParam, setShotParam] = useQueryState("shot", parseAsString);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reviseRef = useRef<HTMLDivElement>(null);
  // Set when a take ends while playing, so the next shot carries on.
  const [playThrough, setPlayThrough] = useState(false);
  const patch = usePatchShot(project.id);

  const index = Math.max(
    0,
    project.shots.findIndex((shot) => shot.id === shotParam),
  );
  const shot = project.shots[index] ?? null;
  const title = project.title;

  const select = (next: number) => {
    const target = project.shots[next];
    if (target !== undefined) void setShotParam(target.id);
  };

  const toggle = (field: "flagged" | "locked", current: Shot) => {
    const value = !current[field];
    patch.mutate(
      {
        shotId: current.id,
        patch: field === "flagged" ? { flagged: value } : { locked: value },
        idempotencyKey: newIdempotencyKey(),
      },
      {
        onError: (error) => {
          toast.error(
            apiErrorDetail(error) ??
              `${current.label} was not ${field === "flagged" ? (value ? "flagged" : "unflagged") : value ? "locked" : "unlocked"}. Try again.`,
          );
        },
      },
    );
  };

  // Keyboard equivalents for every action on this page (AGENTS.md §8).
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || isTypingTarget(event.target)) return;
    if (document.querySelector("[role='dialog']") !== null) return;
    const command = projectCommandFor(event);
    if (command === null || shot === null) return;
    switch (command) {
      case "play": {
        // Space already presses a focused button or radio; leave it be.
        if (event.target instanceof Element && event.target.closest("button,a,[role]")) return;
        const video = videoRef.current;
        if (video === null) return;
        event.preventDefault();
        if (video.paused) void video.play().catch(() => undefined);
        else video.pause();
        return;
      }
      case "previous":
        select(index - 1);
        return;
      case "next":
        select(index + 1);
        return;
      case "flag":
        toggle("flagged", shot);
        return;
      case "lock":
        toggle("locked", shot);
        return;
      case "revise":
        event.preventDefault();
        reviseRef.current?.focus();
        return;
    }
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      onKeyDown(event);
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, []);

  const take = shot === null ? null : selectedTake(shot);

  return (
    <>
      <header className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="-ms-3 self-start">
          <Link href="/projects">
            <ArrowLeft aria-hidden="true" /> Projects
          </Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-4xl md:text-5xl text-balance">{title}</h1>
            <p className="tabular text-sm text-muted-foreground">
              {project.shots.length === 1 ? "1 shot" : `${String(project.shots.length)} shots`} ·
              made{" "}
              {formatDistanceToNowStrict(new Date(project.createdAt * 1000), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ShortcutHelp />
            {project.isTour ? (
              <span className="text-sm text-muted-foreground">
                Free tour project: it cannot be exported.
              </span>
            ) : (
              <Button asChild>
                <Link href={`/projects/${encodeURIComponent(project.id)}/export`}>
                  <Download aria-hidden="true" /> Export MP4
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {!project.isTour && !project.exportAvailable ? (
        <p
          className="rounded-md bg-flag/12 px-4 py-3 text-sm text-flag-foreground"
          aria-live="polite"
        >
          No prepared MP4 matches this combination of takes, so it cannot be exported as it is.
          Choose other takes to export.
        </p>
      ) : null}
      {shot === null ? (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">
            This project has no shots yet. Reload in a moment; if it stays empty, the example may
            still be being prepared.
          </p>
        </Card>
      ) : (
        <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-12">
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
            <Card className="flex flex-col gap-2">
              {take === null ? null : (
                <video
                  key={take.id}
                  ref={videoRef}
                  src={take.media.url}
                  controls
                  playsInline
                  preload="metadata"
                  autoPlay={playThrough}
                  aria-label={`${shot.label}, ${takeName(shot, take)}`}
                  className="aspect-video w-full rounded-md bg-foreground"
                  onPlay={() => {
                    setPlayThrough(false);
                  }}
                  onEnded={() => {
                    if (index < project.shots.length - 1) {
                      setPlayThrough(true);
                      select(index + 1);
                    }
                  }}
                />
              )}
              <p className="px-2 pb-1 text-xs text-muted-foreground" aria-live="polite">
                {shot.label} of {project.shots.length}
                {take === null ? null : ` · ${takeName(shot, take)}`}
                {index < project.shots.length - 1 ? " · plays on into the next shot" : null}
              </p>
            </Card>
            <ShotStrip shots={project.shots} activeId={shot.id} onSelect={select} />
          </div>

          <div className="flex flex-col gap-4 md:gap-8 lg:col-span-4">
            <ShotInspector
              key={shot.id}
              projectId={project.id}
              shot={shot}
              index={index}
              total={project.shots.length}
              revisionCost={catalog.data?.prices.revisionCredits ?? null}
              onToggle={(field) => {
                toggle(field, shot);
              }}
              reviseRef={reviseRef}
            />
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Keyboard shortcuts"
          className="hidden lg:inline-flex"
        >
          <Keyboard aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="px-3 pt-2 pb-1 text-sm font-medium">Keyboard shortcuts</p>
        <ul className="flex flex-col">
          {PROJECT_SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.command}
              className="flex h-9 items-center justify-between gap-3 rounded-md px-3 text-sm"
            >
              <span>{shortcut.label}</span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function ShotStrip({
  shots,
  activeId,
  onSelect,
}: {
  readonly shots: readonly Shot[];
  readonly activeId: string;
  readonly onSelect: (index: number) => void;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <h2 className="px-3 pt-1.5 pb-1 font-display text-xl">Shots</h2>
      <ToggleGroup
        type="single"
        aria-label="Shots"
        value={activeId}
        onValueChange={(next) => {
          const found = shots.findIndex((item) => item.id === next);
          if (found >= 0) onSelect(found);
        }}
        spacing={1}
        className="w-full overflow-x-auto rounded-md bg-muted p-1"
      >
        {shots.map((item) => {
          const state = shotState(item);
          const meta = SHOT_STATE_META[state];
          const frame = selectedTake(item)?.media.url ?? null;
          return (
            <ToggleGroupItem
              key={item.id}
              value={item.id}
              aria-label={`${item.label}, ${meta.label}`}
              className="h-auto w-32 shrink-0 flex-col items-stretch gap-1 rounded-sm p-1 hover:bg-card data-[state=on]:bg-card"
            >
              {frame === null ? null : (
                <TakeFrame videoUrl={frame} className="aspect-video rounded-xs" />
              )}
              <span className={cn("h-1 rounded-full", meta.fill)} aria-hidden="true" />
              <span className="flex items-center justify-between gap-1 px-1 pb-0.5 text-xs">
                <span className="tabular truncate">{item.label}</span>
                <meta.icon className={cn("size-3.5 shrink-0", meta.tone)} aria-hidden="true" />
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </Card>
  );
}

function ShotInspector({
  projectId,
  shot,
  index,
  total,
  revisionCost,
  onToggle,
  reviseRef,
}: {
  readonly projectId: string;
  readonly shot: Shot;
  readonly index: number;
  readonly total: number;
  readonly revisionCost: number | null;
  readonly onToggle: (field: "flagged" | "locked") => void;
  readonly reviseRef: RefObject<HTMLDivElement | null>;
}) {
  const titleId = useId();
  const state = shotState(shot);

  return (
    <Section
      title={shot.label}
      titleId={titleId}
      description={`Shot ${String(index + 1)} of ${String(total)} · ${formatSeconds(shot.durationSeconds)}`}
      action={<StateBadge state={state} />}
      well={false}
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 rounded-md bg-muted p-1">
          <Toggle
            pressed={shot.flagged}
            onPressedChange={() => {
              onToggle("flagged");
            }}
            className="flex-1 data-[state=on]:bg-card data-[state=on]:text-flag-foreground"
          >
            <Flag aria-hidden="true" /> {shot.flagged ? "Flagged" : "Flag"}
            <Kbd className="ms-1 hidden lg:inline-flex">F</Kbd>
          </Toggle>
          <Toggle
            pressed={shot.locked}
            onPressedChange={() => {
              onToggle("locked");
            }}
            className="flex-1 data-[state=on]:bg-card"
          >
            <Lock aria-hidden="true" /> {shot.locked ? "Locked" : "Lock"}
            <Kbd className="ms-1 hidden lg:inline-flex">⇧L</Kbd>
          </Toggle>
        </div>

        <Takes projectId={projectId} shot={shot} />
        <Revise projectId={projectId} shot={shot} cost={revisionCost} reviseRef={reviseRef} />
      </div>
    </Section>
  );
}

function Takes({ projectId, shot }: { readonly projectId: string; readonly shot: Shot }) {
  const baseId = useId();
  const patch = usePatchShot(projectId);
  const current = selectedTake(shot);

  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted p-1">
      <h3 id={`${baseId}-heading`} className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs font-medium text-muted-foreground">Takes</span>
        <span className="tabular text-xs text-muted-foreground">{shot.takes.length}</span>
      </h3>
      {shot.takes.length === 0 ? (
        <p className="px-3 pb-2 text-sm text-muted-foreground">This shot has no takes yet.</p>
      ) : (
        <RadioGroup
          aria-labelledby={`${baseId}-heading`}
          value={current?.id ?? ""}
          disabled={shot.locked}
          onValueChange={(takeId) => {
            patch.mutate(
              {
                shotId: shot.id,
                patch: { selectedTakeId: takeId },
                idempotencyKey: newIdempotencyKey(),
              },
              {
                onError: (error) => {
                  toast.error(
                    apiErrorDetail(error) ??
                      `The take for ${shot.label} did not change. Try again.`,
                  );
                },
              },
            );
          }}
          className="flex flex-col gap-1"
        >
          {shot.takes.map((take) => {
            const id = `${baseId}-${take.id}`;
            const active = take.id === current?.id;
            return (
              <Label
                key={take.id}
                htmlFor={id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-1 rounded-sm p-1 pe-3 leading-normal font-normal hover:bg-card",
                  active && "bg-card",
                  shot.locked && "cursor-not-allowed",
                )}
              >
                <TakeFrame
                  videoUrl={take.media.url}
                  className="aspect-video w-20 shrink-0 rounded-xs"
                />
                <span className="flex min-w-0 flex-1 flex-col ps-2">
                  <span className="truncate text-sm font-medium">{takeName(shot, take)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(take.createdAt * 1000), {
                      addSuffix: true,
                    })}
                  </span>
                </span>
                <RadioGroupItem id={id} value={take.id} />
              </Label>
            );
          })}
        </RadioGroup>
      )}
      {shot.locked ? (
        <p className="px-3 pb-2 text-xs text-muted-foreground">
          Locked. Unlock the shot to choose another take.
        </p>
      ) : null}
    </div>
  );
}

function Revise({
  projectId,
  shot,
  cost,
  reviseRef,
}: {
  readonly projectId: string;
  readonly shot: Shot;
  readonly cost: number | null;
  readonly reviseRef: RefObject<HTMLDivElement | null>;
}) {
  const baseId = useId();
  const revise = useReviseShot(projectId);
  const canAfford = useCanAfford(cost);
  const [optionId, setOptionId] = useState<string | null>(null);
  // One key per revision bought; a retry of the same one reuses it.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const option = shot.revisionOptions.find((item) => item.id === optionId) ?? null;

  return (
    <div
      ref={reviseRef}
      tabIndex={-1}
      aria-labelledby={`${baseId}-heading`}
      role="group"
      className="flex flex-col gap-1 rounded-md bg-muted p-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <h3
        id={`${baseId}-heading`}
        className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground"
      >
        Revise this shot
      </h3>
      {shot.revisionOptions.length === 0 ? (
        <p className="px-3 pb-2 text-sm text-muted-foreground">
          This shot has no prepared revisions.
        </p>
      ) : (
        <>
          <RadioGroup
            aria-labelledby={`${baseId}-heading`}
            value={optionId ?? ""}
            disabled={shot.locked || revise.isPending}
            onValueChange={(next) => {
              setOptionId(next);
              setIdempotencyKey(newIdempotencyKey());
              revise.reset();
            }}
            className="flex flex-col gap-1"
          >
            {shot.revisionOptions.map((item) => {
              const id = `${baseId}-${item.id}`;
              return (
                <Label
                  key={item.id}
                  htmlFor={id}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-start gap-3 rounded-sm px-3 py-2.5 leading-normal font-normal hover:bg-card",
                    item.id === optionId && "bg-card",
                    shot.locked && "cursor-not-allowed",
                  )}
                >
                  <RadioGroupItem id={id} value={item.id} className="mt-0.5" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {item.prompt}
                    </span>
                  </span>
                </Label>
              );
            })}
          </RadioGroup>
          <div className="flex flex-col gap-3 rounded-sm bg-card p-3">
            {shot.locked ? (
              <p className="text-sm text-muted-foreground">Locked. Unlock the shot to revise it.</p>
            ) : (
              <CostNotice cost={cost} />
            )}
            {revise.isError ? (
              <p role="alert" className="text-sm text-destructive-foreground">
                {apiErrorDetail(revise.error) ?? "The revision did not go through."} Try again: you
                are only charged once.
              </p>
            ) : null}
            <p className="sr-only" aria-live="polite">
              {revise.isPending ? `Revising ${shot.label}` : ""}
            </p>
            <Button
              variant="secondary"
              disabled={shot.locked || option === null || canAfford !== true || revise.isPending}
              onClick={() => {
                if (option === null) return;
                revise.mutate(
                  { shotId: shot.id, revisionOptionId: option.id, idempotencyKey },
                  {
                    onSuccess: () => {
                      toast(`A new take was added to ${shot.label}.`);
                      setOptionId(null);
                      setIdempotencyKey(newIdempotencyKey());
                    },
                  },
                );
              }}
            >
              {revise.isPending
                ? "Revising…"
                : option === null
                  ? "Choose a revision"
                  : `Revise with “${option.label}”`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
