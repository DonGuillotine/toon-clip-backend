"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { formatCredits } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

import { useRetryGeneration } from "../mutations";
import { generationsQuery } from "../queries";
import { type Generation, type QuickTab } from "../schema";

const TAB_LABEL = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  composition: "Composition",
  stitch: "Stitch",
} satisfies Record<QuickTab, string>;

/** Quick create results, newest first, polled while anything is in flight. */
export function RecentGenerations({ titleId }: { readonly titleId: string }) {
  const generations = useQuery(generationsQuery);
  const hydrated = useHydrated();

  return (
    <Section
      title="Recent quick creates"
      titleId={titleId}
      count={generations.data?.length ?? null}
    >
      {generations.isError ? (
        <div className="flex flex-col items-start gap-2 p-3">
          <p className="text-sm">Recent quick creates did not load.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void generations.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : !generations.data ? (
        <div className="flex flex-col gap-1">
          <Skeleton className="h-14 rounded-sm" />
          <Skeleton className="h-14 rounded-sm" />
        </div>
      ) : generations.data.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">
          Nothing made yet. Describe something above and press Generate.
        </p>
      ) : (
        <ul className="flex flex-col gap-1" aria-live="polite">
          {generations.data.map((generation) => (
            <GenerationRow key={generation.id} generation={generation} hydrated={hydrated} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function GenerationRow({
  generation,
  hydrated,
}: {
  readonly generation: Generation;
  readonly hydrated: boolean;
}) {
  const meta = SHOT_STATE_META[generation.status];
  const Icon = meta.icon;
  return (
    <li className="flex flex-col gap-1 rounded-sm p-3 hover:bg-card">
      <div className="flex items-center gap-2">
        <span className={cn("flex shrink-0 items-center gap-1 text-xs font-medium", meta.tone)}>
          <Icon aria-hidden="true" className="size-3.5" />
          {meta.label}
        </span>
        <span className="text-xs text-muted-foreground">{TAB_LABEL[generation.tab]}</span>
        <span className="ms-auto text-xs text-muted-foreground">
          {/* Relative time differs between server and client; wait for hydration. */}
          {hydrated ? formatDistanceToNow(generation.createdAt, { addSuffix: true }) : null}
        </span>
      </div>
      <p className="truncate text-sm">{generation.prompt || "No prompt"}</p>
      <Detail generation={generation} />
    </li>
  );
}

function Detail({ generation }: { readonly generation: Generation }) {
  switch (generation.status) {
    case "queued":
      return (
        <p className="text-xs text-muted-foreground">
          Number {generation.positionInQueue} in the queue
        </p>
      );
    case "generating":
      return (
        <Progress
          value={generation.progress}
          aria-label={`${String(generation.progress)} percent generated`}
        />
      );
    case "ready":
      return (
        <p className="tabular text-xs text-muted-foreground">
          {generation.modelName ?? "Model chosen by the API"}, {formatCredits(generation.credits)}{" "}
          credits
        </p>
      );
    case "failed":
      return <FailedDetail generation={generation} />;
  }
}

function FailedDetail({
  generation,
}: {
  readonly generation: Extract<Generation, { status: "failed" }>;
}) {
  const retry = useRetryGeneration();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs text-destructive-foreground">
        {generation.reason} {formatCredits(generation.creditsRefunded)} credits refunded.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="ms-auto"
        disabled={retry.isPending}
        onClick={() => {
          retry.mutate(generation.id);
        }}
      >
        Retry
      </Button>
    </div>
  );
}
