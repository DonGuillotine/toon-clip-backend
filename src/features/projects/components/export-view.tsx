"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, CircleAlert, Download, Flag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useId, useState } from "react";

import { LoadError } from "@/components/load-state";
import { Card, Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogQuery } from "@/features/catalog/queries";
import { CostNotice, useCanAfford } from "@/features/credits/components/cost-notice";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { ApiError, apiErrorDetail, newIdempotencyKey } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { useCreateExport } from "../mutations";
import { exportQuery, projectQuery } from "../queries";
import { type Project } from "../schema";
import { formatSeconds, selectedTake, shotState, takeName } from "../shots";
import { TakeFrame } from "./project-art";

/**
 * Export a project as one MP4 of its selected takes. Paid in credits, once;
 * no wallet checkout. The export being watched lives in the URL
 * (`?export=`), so a reload keeps following it.
 */
export function ExportView({ projectId }: { readonly projectId: string }) {
  const project = useQuery(projectQuery(projectId));
  const catalog = useQuery(catalogQuery);
  const [exportId, setExportId] = useQueryState("export", parseAsString);

  if (project.isPending) return <ExportSkeleton />;
  if (project.isError) {
    if (project.error instanceof ApiError && project.error.status === 404) notFound();
    return (
      <Card>
        <LoadError onRetry={() => void project.refetch()}>This project did not load.</LoadError>
      </Card>
    );
  }

  const title = project.data.title;

  return (
    <>
      <header className="flex flex-col gap-3">
        <Button asChild variant="ghost" size="sm" className="-ms-3 self-start">
          <Link href={`/projects/${encodeURIComponent(projectId)}`}>
            <ArrowLeft aria-hidden="true" /> {title}
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Export MP4</h1>
      </header>
      <div className="grid items-start gap-4 md:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Contents project={project.data} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5">
          {exportId === null ? (
            <Unlock
              project={project.data}
              cost={catalog.data?.prices.exportCredits ?? null}
              onStarted={(id) => void setExportId(id)}
            />
          ) : (
            <Status exportId={exportId} onStartOver={() => void setExportId(null)} />
          )}
        </div>
      </div>
    </>
  );
}

export function ExportSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-16 w-full max-w-sm rounded-md" />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-xl lg:col-span-7" />
        <Skeleton className="h-64 rounded-xl lg:col-span-5" />
      </div>
    </div>
  );
}

/** What goes into the file: each shot's selected take, in order. */
function Contents({ project }: { readonly project: Project }) {
  const titleId = useId();
  return (
    <Section
      title="In this export"
      titleId={titleId}
      description="Each shot's selected take, in order. Change a take on the project page."
      count={project.shots.length}
    >
      {project.shots.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">This project has no shots to export.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {project.shots.map((shot) => {
            const take = selectedTake(shot);
            const state = shotState(shot);
            const meta = SHOT_STATE_META[state];
            return (
              <li key={shot.id} className="flex items-center gap-1 rounded-sm bg-card p-1 pe-3">
                {take === null ? null : (
                  <TakeFrame
                    videoUrl={take.media.url}
                    className="aspect-video w-20 shrink-0 rounded-xs"
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col ps-2">
                  <span className="truncate text-sm font-medium">{shot.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {take === null
                      ? formatSeconds(shot.durationSeconds)
                      : `${takeName(shot, take)} · ${formatSeconds(shot.durationSeconds)}`}
                  </span>
                </span>
                <span className={cn("flex items-center gap-1 text-xs", meta.tone)}>
                  <meta.icon className="size-3.5" aria-hidden="true" />
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

function Unlock({
  project,
  cost,
  onStarted,
}: {
  readonly project: Project;
  readonly cost: number | null;
  readonly onStarted: (exportId: string) => void;
}) {
  const titleId = useId();
  const create = useCreateExport(project.id);
  const canAfford = useCanAfford(cost);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const flagged = project.shots.filter((shot) => shot.flagged).length;

  return (
    <Card aria-labelledby={titleId} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="text-sm font-medium">
          Unlock the MP4
        </h2>
        <p className="text-sm text-muted-foreground">
          Paid from your credits. No wallet checkout is needed.
        </p>
      </div>
      {flagged > 0 ? (
        <p className="flex items-start gap-2 rounded-md bg-flag/12 px-3 py-2 text-sm text-flag-foreground">
          <Flag className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {flagged === 1 ? "1 shot is flagged." : `${String(flagged)} shots are flagged.`} Export
          anyway, or fix them on the project page first.
        </p>
      ) : null}
      {project.isTour ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          This is a free tour project, so it cannot be exported. Create a project from an example to
          export it.
        </p>
      ) : !project.exportAvailable ? (
        <p className="rounded-md bg-flag/12 px-3 py-2 text-sm text-flag-foreground">
          No prepared MP4 matches the takes chosen right now. Change a take on the project page,
          then export.
        </p>
      ) : (
        <CostNotice cost={cost} />
      )}
      <p className="text-xs text-muted-foreground">
        Charged once per set of takes. Exporting a set you already unlocked is free.
      </p>
      {create.isError ? (
        <p role="alert" className="text-sm text-destructive-foreground">
          {apiErrorDetail(create.error) ?? "The export did not start."} Try again: you are only
          charged once.
        </p>
      ) : null}
      <Button
        className="self-start"
        disabled={
          project.isTour ||
          !project.exportAvailable ||
          project.shots.length === 0 ||
          canAfford !== true ||
          create.isPending ||
          create.isSuccess
        }
        onClick={() => {
          create.mutate(
            { idempotencyKey },
            {
              onSuccess: ({ id }) => {
                onStarted(id);
              },
            },
          );
        }}
      >
        <Download aria-hidden="true" />
        {create.isPending || create.isSuccess ? "Starting export…" : "Export MP4"}
      </Button>
    </Card>
  );
}

function Status({
  exportId,
  onStartOver,
}: {
  readonly exportId: string;
  readonly onStartOver: () => void;
}) {
  const query = useQuery(exportQuery(exportId));

  if (query.isPending) return <Skeleton className="h-40 rounded-xl" />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) {
      return (
        <Card className="flex flex-col items-start gap-3 p-4">
          <p className="text-sm">
            That export is not here. It may belong to another browser session.
          </p>
          <Button variant="secondary" onClick={onStartOver}>
            Back to export
          </Button>
        </Card>
      );
    }
    return (
      <Card>
        <LoadError onRetry={() => void query.refetch()}>The export status did not load.</LoadError>
      </Card>
    );
  }

  const item = query.data;
  switch (item.state) {
    case "queued":
    case "processing":
      return (
        <Card className="flex flex-col gap-3 p-4" aria-live="polite" aria-busy="true">
          <p className="text-sm font-medium">
            {item.state === "queued" ? "Waiting to render your MP4" : "Rendering your MP4"}
          </p>
          <span
            aria-hidden="true"
            className={cn("block h-1.5 rounded-full", SHOT_STATE_META.generating.fill)}
          />
          <p className="text-xs text-muted-foreground">
            You can leave this page. The link keeps following the export.
          </p>
        </Card>
      );
    case "ready":
      return (
        <Card className="flex flex-col items-start gap-3 p-4" aria-live="polite">
          <span className="grid size-10 place-items-center rounded-full bg-spot text-spot-foreground">
            <Check className="size-5" aria-hidden="true" />
          </span>
          <p className="text-base font-medium">Your MP4 is ready</p>
          {item.download === undefined ? (
            <p className="text-sm text-muted-foreground">
              The download link is not available yet. Reload in a moment.
            </p>
          ) : (
            <Button asChild variant="spot">
              <a href={item.download.url} download target="_blank" rel="noopener noreferrer">
                <Download aria-hidden="true" /> Download MP4
              </a>
            </Button>
          )}
        </Card>
      );
    case "failed":
      return (
        <Card className="flex flex-col items-start gap-3 p-4" role="alert">
          <p className="flex items-center gap-2 text-sm font-medium text-destructive-foreground">
            <CircleAlert className="size-4" aria-hidden="true" /> The export failed.
          </p>
          <p className="text-sm text-muted-foreground">
            Your credit history on the{" "}
            <Link
              href="/credits"
              className="font-medium text-foreground underline underline-offset-4"
            >
              credits page
            </Link>{" "}
            shows whether it was refunded.
          </p>
          <Button variant="secondary" onClick={onStartOver}>
            Try the export again
          </Button>
        </Card>
      );
  }
}
