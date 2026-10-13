"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { WandSparkles } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { formatClock } from "@/features/catalog/beats";
import { CostNotice, useCanAfford } from "@/features/credits/components/cost-notice";
import { DevBadge } from "@/features/dev-mode/components/dev-mode";
import { useDevMode } from "@/features/dev-mode/use-dev-mode";
import { type Segment } from "@/features/projects/segments";
import { SHOT_STATE_META } from "@/features/storyboards/shot-state";
import { apiErrorDetail, newIdempotencyKey } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { useCreateSegmentFix, useRetrySegmentFix } from "../mutations";
import { segmentFixesQuery } from "../queries";
import { isActive, type SegmentFix } from "../schema";

const InstructionSchema = z.object({
  instruction: z
    .string()
    .trim()
    .min(3, "Say what should change, in a few words.")
    .max(600, "Keep it under 600 characters."),
});

type Instruction = z.infer<typeof InstructionSchema>;

function overlaps(fix: SegmentFix, segment: Segment): boolean {
  return fix.startSeconds < segment.endSeconds && fix.endSeconds > segment.startSeconds;
}

/**
 * The fixes still rendering on one shot, for marks on the segment strip.
 * Empty with dev mode off: the API has no fixes to report yet.
 */
export function useActiveFixes(projectId: string, shotId: string): readonly SegmentFix[] {
  const devMode = useDevMode();
  const fixes = useQuery({ ...segmentFixesQuery(projectId), enabled: devMode });
  if (!devMode) return [];
  return (fixes.data?.items ?? []).filter((fix) => fix.shotId === shotId && isActive(fix));
}

/**
 * Fix one segment with AI: say what should change between two cuts, and the
 * segment renders again as a new take on the shot. Runs on fixtures until
 * the API has the endpoint (`../schema.ts`), so it renders only in dev mode.
 */
export function SegmentFixPanel({
  projectId,
  shotId,
  segment,
  locked,
  cost,
}: {
  readonly projectId: string;
  readonly shotId: string;
  readonly segment: Segment;
  readonly locked: boolean;
  /** The price before committing, from the API. `null` while it loads. */
  readonly cost: number | null;
}) {
  const devMode = useDevMode();
  if (!devMode) return null;
  return (
    <FixForm
      // One form, and one idempotency key, per segment being fixed.
      key={`${shotId}:${String(segment.startSeconds)}-${String(segment.endSeconds)}`}
      projectId={projectId}
      shotId={shotId}
      segment={segment}
      locked={locked}
      cost={cost}
    />
  );
}

function FixForm({
  projectId,
  shotId,
  segment,
  locked,
  cost,
}: {
  readonly projectId: string;
  readonly shotId: string;
  readonly segment: Segment;
  readonly locked: boolean;
  readonly cost: number | null;
}) {
  const fieldId = useId();
  const errorId = useId();
  const create = useCreateSegmentFix(projectId);
  const canAfford = useCanAfford(cost);
  const fixes = useQuery(segmentFixesQuery(projectId));
  // Kept across retries of this one request, so a retry is never a second charge.
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey);
  const form = useForm<Instruction>({
    resolver: zodResolver(InstructionSchema),
    defaultValues: { instruction: "" },
  });
  const error = form.formState.errors.instruction?.message;

  const here = (fixes.data?.items ?? [])
    .filter((fix) => fix.shotId === shotId && overlaps(fix, segment))
    .sort((a, b) => b.createdAt - a.createdAt);

  const onSubmit = form.handleSubmit(({ instruction }) => {
    create.mutate(
      {
        projectId,
        shotId,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        instruction,
        idempotencyKey,
      },
      {
        onSuccess: () => {
          toast(`Segment ${String(segment.number)} is queued to render again.`);
          form.reset();
          setIdempotencyKey(newIdempotencyKey());
        },
      },
    );
  });

  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-lg">Fix with AI</h3>
        <DevBadge />
      </div>
      {locked ? (
        <p className="text-sm text-muted-foreground">
          This shot is locked. Unlock it to fix a segment.
        </p>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldId}>
              What should change from {formatClock(segment.startSeconds)} to{" "}
              {formatClock(segment.endSeconds)}?
            </Label>
            <Textarea
              id={fieldId}
              rows={3}
              placeholder="For example: the dust cloud swallows him completely, then clears faster."
              aria-invalid={error !== undefined}
              aria-describedby={error === undefined ? undefined : errorId}
              {...form.register("instruction")}
            />
            {error === undefined ? null : (
              <p id={errorId} role="alert" className="text-xs text-destructive-foreground">
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Only this segment renders again. The rest of the shot stays as it is, and the current
              take is kept.
            </p>
          </div>
          <CostNotice cost={cost} />
          {create.isError ? (
            <p role="alert" className="text-sm text-destructive-foreground">
              {apiErrorDetail(create.error) ?? "The fix was not sent."} Try again: you are only
              charged once.
            </p>
          ) : null}
          <Button
            type="submit"
            variant="spot"
            className="self-start"
            disabled={canAfford !== true || create.isPending}
          >
            <WandSparkles aria-hidden="true" />
            {create.isPending ? "Sending…" : `Fix segment ${String(segment.number)}`}
          </Button>
        </form>
      )}

      {here.length === 0 ? null : (
        <ul aria-label="Fixes for this segment" className="flex flex-col gap-1" aria-live="polite">
          {here.map((fix) => (
            <FixRow key={fix.id} projectId={projectId} fix={fix} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FixRow({ projectId, fix }: { readonly projectId: string; readonly fix: SegmentFix }) {
  const retry = useRetrySegmentFix(projectId);
  const meta = SHOT_STATE_META[fix.state];
  const range = `${formatClock(fix.startSeconds)} to ${formatClock(fix.endSeconds)}`;

  return (
    <li className="flex flex-col gap-2 rounded-sm bg-card px-3 py-2.5">
      <div className="flex items-start gap-2">
        <meta.icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", meta.tone)} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn("text-sm font-medium", meta.tone)}>
            {fix.state === "generating" ? "Rendering" : meta.label}
            <span className="tabular font-normal text-muted-foreground"> · {range}</span>
          </span>
          <span className="line-clamp-2 text-xs text-muted-foreground">{fix.instruction}</span>
        </div>
      </div>
      <FixStateDetail
        fix={fix}
        onRetry={() => {
          retry.mutate(fix.id);
        }}
        retrying={retry.isPending}
      />
    </li>
  );
}

function FixStateDetail({
  fix,
  onRetry,
  retrying,
}: {
  readonly fix: SegmentFix;
  readonly onRetry: () => void;
  readonly retrying: boolean;
}) {
  switch (fix.state) {
    case "queued":
      return <p className="text-xs text-muted-foreground">Waiting for a free renderer.</p>;
    case "generating": {
      const percent = Math.round(fix.progress * 100);
      return (
        <div className="flex items-center gap-2">
          <Progress value={percent} aria-label="Render progress" />
          <span className="tabular w-10 shrink-0 text-end text-xs text-muted-foreground">
            {percent}%
          </span>
        </div>
      );
    }
    case "ready":
      return (
        <p className="text-xs text-muted-foreground">
          {fix.takeId === null
            ? "Rendered. Sample data cannot add a take to this project; with the API it appears under Takes."
            : "Rendered. The new take is selected under Takes; the old one is kept."}
        </p>
      );
    case "failed":
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-destructive-foreground">{fix.reason}</p>
          <Button size="sm" variant="secondary" disabled={retrying} onClick={onRetry}>
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        </div>
      );
  }
}
