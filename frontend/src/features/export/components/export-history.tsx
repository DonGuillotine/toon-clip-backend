"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Captions,
  Check,
  CircleAlert,
  Clock,
  Download,
  FileVideo,
  Layers,
  Loader,
  type LucideIcon,
  Music,
  Package,
  RotateCcw,
  Upload,
} from "lucide-react";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHydrated } from "@/lib/use-hydrated";

import { type ExportJob, type ExportKind, type ExportStatus, type UploadStatus } from "../schema";

/** Where a direct upload is, after the render. Icon and word, never colour alone. */
function UploadDetail({ upload }: { readonly upload: UploadStatus }) {
  switch (upload.state) {
    case "waiting":
      return (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock aria-hidden="true" className="size-3.5" /> Upload to {upload.platform} starts in a
          moment.
        </p>
      );
    case "uploading":
      return (
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload aria-hidden="true" className="size-3.5" /> Uploading to {upload.platform}
          </p>
          <div className="flex items-center gap-3">
            <Progress
              value={upload.progress}
              aria-label={`Uploading ${String(upload.progress)}%`}
            />
            <span className="tabular text-xs text-muted-foreground">{upload.progress}%</span>
          </div>
        </div>
      );
    case "published":
      return (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check aria-hidden="true" className="size-3.5" /> Published to {upload.platform} as @
          {upload.handle}: &ldquo;{upload.title}&rdquo;, {upload.visibility}.
        </p>
      );
  }
}

/** Every export state carries an icon and a word, never colour alone. */
const STATUS_META = {
  preparing: { label: "Preparing", icon: Package, variant: "default" },
  rendering: { label: "Rendering", icon: Loader, variant: "live" },
  ready: { label: "Ready", icon: Check, variant: "default" },
  failed: { label: "Failed", icon: CircleAlert, variant: "destructive" },
} satisfies Record<
  ExportStatus,
  { label: string; icon: LucideIcon; variant: "default" | "live" | "destructive" }
>;

const KIND_META = {
  psd: { label: "Layered PSD", icon: Layers },
  video: { label: "Video", icon: FileVideo },
} satisfies Record<ExportKind, { label: string; icon: LucideIcon }>;

function StatusDetail({
  job,
  hydrated,
  onRetry,
  retrying,
}: {
  readonly job: ExportJob;
  readonly hydrated: boolean;
  readonly onRetry: (id: string) => void;
  readonly retrying: boolean;
}) {
  switch (job.status) {
    case "preparing":
      return <p className="text-xs text-muted-foreground">Gathering takes and audio.</p>;
    case "rendering":
      return (
        <div className="flex items-center gap-3">
          <Progress value={job.progress} aria-label={`Rendering ${String(job.progress)}%`} />
          <span className="tabular text-xs text-muted-foreground">{job.progress}%</span>
        </div>
      );
    case "ready": {
      const { expired } = job;
      return (
        <div className="flex flex-col gap-2">
          {expired ? (
            <p className="text-xs text-muted-foreground">
              This link expired. Export again to get a fresh one.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <a href={job.downloadUrl} download>
                  <Download aria-hidden="true" /> Download {job.fileName}
                </a>
              </Button>
              {job.audioFileName === null ? null : (
                <Button asChild size="sm" variant="secondary">
                  <a href={`${job.downloadUrl}?part=audio`} download>
                    <Music aria-hidden="true" /> Audio
                  </a>
                </Button>
              )}
              {job.subtitleFileName === null ? null : (
                <Button asChild size="sm" variant="secondary">
                  <a href={`${job.downloadUrl}?part=subtitles`} download>
                    <Captions aria-hidden="true" /> Subtitles
                  </a>
                </Button>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {job.audioFileName === null
              ? null
              : `Audio cannot live in a PSD, so it is in ${job.audioFileName}. `}
            {job.parts > 1
              ? `Too many layers for one file, so it is split into ${String(job.parts)} numbered files. `
              : null}
            {expired
              ? null
              : hydrated
                ? `Link expires in ${formatDistanceToNowStrict(new Date(job.expiresAt))}.`
                : "Link lasts 7 days."}
          </p>
          {job.upload === null ? null : <UploadDetail upload={job.upload} />}
        </div>
      );
    }
    case "failed":
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-destructive-foreground">{job.reason}</p>
          <Button
            size="sm"
            variant="secondary"
            disabled={retrying}
            onClick={() => {
              onRetry(job.id);
            }}
          >
            <RotateCcw aria-hidden="true" /> Try again
          </Button>
        </div>
      );
  }
}

/** Every export for this storyboard, newest first. Updates on its own while a render runs. */
export function ExportHistory({
  exports,
  onRetry,
  retrying,
}: {
  readonly exports: readonly ExportJob[];
  readonly onRetry: (id: string) => void;
  readonly retrying: boolean;
}) {
  const hydrated = useHydrated();

  return (
    <Section
      title="Export history"
      titleId="export-history"
      count={exports.length}
      description="Large exports run in the background. You can leave this page."
    >
      {exports.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          Nothing exported yet. Your exports will be kept here.
        </p>
      ) : (
        <ul aria-live="polite" className="flex flex-col gap-1">
          {exports.map((job) => {
            const status = STATUS_META[job.status];
            const kind = KIND_META[job.kind];
            const StatusIcon = status.icon;
            const KindIcon = kind.icon;
            return (
              <li key={job.id} className="flex flex-col gap-2 rounded-sm px-3 py-3 hover:bg-card">
                <div className="flex flex-wrap items-center gap-2">
                  <KindIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{kind.label}</span>
                  <Badge variant={status.variant}>
                    <StatusIcon aria-hidden="true" /> {status.label}
                  </Badge>
                  <span className="ms-auto text-xs text-muted-foreground">
                    {hydrated ? `${formatDistanceToNowStrict(new Date(job.createdAt))} ago` : null}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{job.summary}</p>
                <StatusDetail job={job} hydrated={hydrated} onRetry={onRetry} retrying={retrying} />
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
