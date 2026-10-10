"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Clock, Loader } from "lucide-react";
import { toast } from "sonner";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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

export function GeneratingNow() {
  const { data, isPending, isError, refetch } = useQuery(activeJobsQuery);
  const running = data ? data.filter((job) => job.status !== "failed").length : null;

  return (
    <Section title="Generating" titleId="jobs-heading" count={running} className="h-full">
      {isPending ? (
        <div className="flex flex-col gap-1">
          <Skeleton className="h-16 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
          <Skeleton className="h-11 rounded-sm" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 p-3">
          <p className="text-sm font-medium">The queue did not load.</p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">
          Nothing is generating. Start something above.
        </p>
      ) : (
        <ul aria-live="polite" className="flex flex-col gap-0.5">
          {data.map((job) => (
            <li
              key={job.id}
              className="rounded-sm px-3 py-2.5 transition-colors duration-(--duration-press) ease-out-strong hover:bg-card"
            >
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function JobRow({ job }: { readonly job: Job }) {
  const title = (
    <p className="truncate text-sm">
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
            <Loader
              className="size-4 shrink-0 animate-spin text-live-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">{title}</div>
            <span className="tabular text-sm font-medium">{Math.round(job.progress)}%</span>
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
              Failed: {job.reason}. {job.creditsRefunded} credits refunded.
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
