"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Clock } from "lucide-react";
import { toast } from "sonner";

import { DockItem } from "@/components/dock/dock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { activeJobsQuery } from "../queries";
import { type Job } from "../schema";

const ordinal = new Intl.PluralRules("en", { type: "ordinal" });
const SUFFIX = {
  one: "st",
  two: "nd",
  few: "rd",
  other: "th",
  zero: "th",
  many: "th",
} satisfies Record<Intl.LDMLPluralRule, string>;
const nth = (n: number): string => `${String(n)}${SUFFIX[ordinal.select(n)]}`;

const RING = 2 * Math.PI * 15;

/**
 * The generation queue as the dock's first circle: a ring filled to the
 * running job's progress, with focus lines spinning inside while anything
 * is moving, and a red dot when something failed. Hover opens the queue.
 */
export function QueueDockItem() {
  const { data } = useQuery(activeJobsQuery);
  const jobs = data ?? [];
  const running = jobs.filter((job) => job.status !== "failed");
  const failed = jobs.length - running.length;
  const lead = jobs.find((job) => job.status === "generating");
  const progress = lead?.status === "generating" ? lead.progress : 0;

  const label =
    data === undefined
      ? "Generation queue"
      : `${running.length === 0 ? "Nothing generating" : `${String(running.length)} generating`}${failed > 0 ? `, ${String(failed)} failed` : ""}`;

  return (
    <DockItem
      label={label}
      icon={
        <span className="relative grid size-9 place-items-center">
          {lead ? (
            <span
              aria-hidden="true"
              className="absolute inset-1.5 animate-[spin_3s_linear_infinite] rounded-full focus-lines [--focus-ink:var(--live)]"
            />
          ) : null}
          <svg viewBox="0 0 36 36" aria-hidden="true" className="absolute inset-0 -rotate-90">
            <circle cx="18" cy="18" r="15" className="fill-none stroke-pending" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15"
              className="fill-none stroke-live-foreground transition-[stroke-dashoffset] duration-(--duration-slow) ease-out-strong"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - progress / 100)}
            />
          </svg>
          <span className="tabular relative text-[0.625rem] font-semibold">
            {lead ? Math.round(progress) : running.length}
          </span>
          {failed > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-destructive" />
          ) : null}
        </span>
      }
    >
      <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1">
        <p className="font-medium">Generating</p>
        <p className="tabular text-xs text-muted-foreground">
          {running.length} running{failed > 0 ? ` · ${String(failed)} failed` : ""}
        </p>
      </div>
      {jobs.length === 0 ? (
        <p className="px-3 pb-3 text-muted-foreground">Nothing is generating.</p>
      ) : (
        <ul aria-live="polite" className="flex flex-col gap-0.5">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-md px-3 py-2.5 hover:bg-accent">
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </DockItem>
  );
}

function JobRow({ job }: { readonly job: Job }) {
  const title = (
    <p className="truncate">
      <span className="font-medium">{job.storyboardTitle}</span>
      <span className="text-muted-foreground">
        {" "}
        · Shot {job.shotNumber} · Take {job.takeNumber}
      </span>
    </p>
  );

  switch (job.status) {
    case "generating":
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">{title}</div>
            <span className="tabular font-medium">{Math.round(job.progress)}%</span>
          </div>
          <Progress value={job.progress} aria-label={`Shot ${String(job.shotNumber)} progress`} />
          <p className="text-xs text-muted-foreground">
            {job.secondsLeft === null ? "Working on it" : `About ${String(job.secondsLeft)} s left`}
          </p>
        </div>
      );
    case "queued":
      return (
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">{title}</div>
          <span className="text-xs text-muted-foreground">{nth(job.positionInQueue)} in line</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-start gap-2">
          <CircleAlert
            className="mt-0.5 size-4 shrink-0 text-destructive-foreground"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title}
            <p className="text-xs text-muted-foreground">
              {job.reason}. {job.creditsRefunded} credits refunded.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              toast("Retry is not connected yet.");
            }}
          >
            Retry
          </Button>
        </div>
      );
  }
}
