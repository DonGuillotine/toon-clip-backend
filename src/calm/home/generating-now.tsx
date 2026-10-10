"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Clock, Loader } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/calm/button";
import { Progress } from "@/components/ui/calm/progress";
import { Skeleton } from "@/components/ui/calm/skeleton";

import { activeJobsQuery } from "@/features/jobs/queries";
import { type Job } from "@/features/jobs/schema";

import { Card, CardHeader } from "../card";

const ordinal = new Intl.PluralRules("en", { type: "ordinal" });
const SUFFIX = {
  one: "st",
  two: "nd",
  few: "rd",
  other: "th",
  zero: "th",
  many: "th",
} satisfies Record<Intl.LDMLPluralRule, string>;
const nth = (n: number): string => `${n}${SUFFIX[ordinal.select(n)]}`;

export function CalmGeneratingNow() {
  const { data, isPending, isError, refetch } = useQuery(activeJobsQuery);
  const running = data?.filter((job) => job.status !== "failed").length ?? 0;

  return (
    <Card aria-labelledby="jobs-heading" className="flex flex-col">
      <CardHeader className="border-b border-line">
        <h2 id="jobs-heading" className="text-base font-semibold">
          Generating
        </h2>
        {data ? <span className="tabular text-sm text-ink-soft">{running} running</span> : null}
      </CardHeader>

      {isPending ? (
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 p-4">
          <p className="font-medium">The queue did not load.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : data.length === 0 ? (
        <p className="p-4 text-ink-soft">Nothing is generating. Start something above.</p>
      ) : (
        <ul aria-live="polite" className="flex flex-col">
          {data.map((job) => (
            <li key={job.id} className="border-b border-line px-4 py-3 last:border-b-0">
              <JobRow job={job} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function JobRow({ job }: { readonly job: Job }) {
  const title = (
    <p className="truncate text-sm">
      <span className="font-medium">{job.storyboardTitle}</span>
      <span className="text-ink-soft">
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
            <Loader className="size-4 shrink-0 animate-spin text-sky-ink" aria-hidden="true" />
            <div className="min-w-0 flex-1">{title}</div>
            <span className="tabular text-sm font-medium">{Math.round(job.progress)}%</span>
          </div>
          <Progress value={job.progress} aria-label={`Shot ${job.shotNumber} progress`} />
          <p className="text-xs text-ink-soft">
            {job.secondsLeft === null ? "Working on it" : `About ${job.secondsLeft} s left`}
          </p>
        </div>
      );
    case "queued":
      return (
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
          <div className="min-w-0 flex-1">{title}</div>
          <span className="text-xs text-ink-soft">{nth(job.positionInQueue)} in line</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-fail" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {title}
            <p className="text-xs text-ink-soft">
              Failed: {job.reason}. {job.creditsRefunded} credits refunded.
            </p>
          </div>
          <Button
            variant="outline"
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
