"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Coins, FileVideo, Layers } from "lucide-react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Card } from "@/components/section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCredits } from "@/lib/format";

import { useRetryExport, useStartExport } from "../mutations";
import { DEFAULT_PSD_OPTIONS, defaultVideoOptions, videoProblem } from "../options";
import { exportQuoteQuery, exportsQuery } from "../queries";
import {
  EXPORT_KINDS,
  type ExportKind,
  type ExportsResponse,
  type ExportJob,
  type PsdOptions,
  PsdOptionsSchema,
  type VideoOptions,
} from "../schema";
import { ExportHistory } from "./export-history";
import { PsdOptionsForm } from "./psd-options";
import { VideoOptionsForm } from "./video-options";

function isExportKind(value: string): value is ExportKind {
  return EXPORT_KINDS.some((kind) => kind === value);
}

/** The export panel: two tabs (in the URL), the options, the action and the history. */
export function ExportPanel({ storyboardId }: { readonly storyboardId: string }) {
  const { data, isError, refetch } = useQuery(exportsQuery(storyboardId));

  if (isError) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6">
        <p className="text-sm">
          The export options did not load. Check your connection and try again.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            void refetch();
          }}
        >
          Try again
        </Button>
      </Card>
    );
  }
  if (!data) return <Skeleton className="h-96 rounded-xl" />;
  return <ExportForm data={data} storyboardId={storyboardId} />;
}

function ExportForm({
  data,
  storyboardId,
}: {
  readonly data: ExportsResponse;
  readonly storyboardId: string;
}) {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(EXPORT_KINDS).withDefault("video"),
  );
  // Drafts: local until submitted.
  const [psd, setPsd] = useState<PsdOptions>(DEFAULT_PSD_OPTIONS);
  const [video, setVideo] = useState<VideoOptions>(() =>
    defaultVideoOptions(data.storyboard.maxResolution, data.storyboard.title),
  );
  useCompletionNotices(data.exports);
  const quote = useQuery(exportQuoteQuery({ storyboardId, kind: tab }));
  const start = useStartExport(storyboardId);
  const retry = useRetryExport(storyboardId);

  const problem =
    tab === "psd"
      ? PsdOptionsSchema.safeParse(psd).success
        ? null
        : "Pick at least one shot to export."
      : videoProblem(video, data.uploadAccount !== null);
  const valid = problem === null;
  const cost = quote.data?.credits ?? null;

  const submit = () => {
    if (tab === "psd") start.mutate({ kind: "psd", storyboardId, options: psd });
    else start.mutate({ kind: "video", storyboardId, options: video });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <header className="flex flex-col items-start gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/storyboards/${storyboardId}`}>
            <ArrowLeft aria-hidden="true" /> Back to timeline
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl md:text-5xl">Export {data.storyboard.title}</h1>
          <p className="text-muted-foreground">
            Take it out as layers to keep painting, or as a finished video.
          </p>
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (isExportKind(value)) void setTab(value);
        }}
        className="gap-4"
      >
        <TabsList aria-label="Export as">
          <TabsTrigger value="psd">
            <Layers aria-hidden="true" /> Layered PSD
          </TabsTrigger>
          <TabsTrigger value="video">
            <FileVideo aria-hidden="true" /> Video
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {tab === "psd" ? (
            <PsdOptionsForm options={psd} shots={data.storyboard.shots} onChange={setPsd} />
          ) : (
            <VideoOptionsForm options={video} data={data} onChange={setVideo} />
          )}
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="flex flex-col gap-3 p-4">
            <p className="flex items-center gap-2 text-sm" aria-live="polite">
              <Coins aria-hidden="true" className="size-4 text-muted-foreground" />
              {cost === null ? (
                <span className="text-muted-foreground">Checking the cost</span>
              ) : (
                <span>
                  This export costs{" "}
                  <span className="tabular font-medium">{formatCredits(cost)}</span> credits.
                </span>
              )}
            </p>
            {problem === null ? null : (
              <p className="text-sm text-destructive-foreground">{problem}</p>
            )}
            <Button
              size="lg"
              disabled={!valid || cost === null || start.isPending}
              onClick={submit}
            >
              {tab === "psd"
                ? "Export layered PSD"
                : video.destination === "upload"
                  ? "Export and upload"
                  : "Export video"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Download links last 7 days. We let you know when it is ready.
            </p>
          </Card>
          <ExportHistory
            exports={data.exports}
            retrying={retry.isPending}
            onRetry={(id) => {
              retry.mutate(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The background completion notice (spec 7.7): when an export this page has
 * watched finishes, fails or publishes, say so once.
 */
function useCompletionNotices(exports: readonly ExportJob[]) {
  const seen = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    const phase = (job: ExportJob): string =>
      job.status === "ready" && job.upload !== null ? `ready-${job.upload.state}` : job.status;
    const previous = seen.current;
    const next = new Map(exports.map((job) => [job.id, phase(job)]));
    seen.current = next;
    if (previous === null) return;
    for (const job of exports) {
      const before = previous.get(job.id);
      const now = next.get(job.id);
      if (before === undefined || before === now) continue;
      if (job.status === "failed") {
        toast.error(`Your export failed: ${job.reason}`);
      } else if (job.status === "ready") {
        if (job.upload?.state === "published") {
          toast(`Published to ${job.upload.platform} as "${job.upload.title}".`);
        } else if (before === "rendering" || before === "preparing") {
          toast(`${job.fileName} is ready to download.`);
        }
      }
    }
  }, [exports]);
}
