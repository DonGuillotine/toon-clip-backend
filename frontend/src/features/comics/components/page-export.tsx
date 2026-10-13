"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { Download, FileImage, Layers, type LucideIcon, RotateCcw } from "lucide-react";
import { useId, useState } from "react";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useHydrated } from "@/lib/use-hydrated";

import { useRetryComicExport, useStartComicExport } from "../mutations";
import { exportBlocker } from "../page";
import { EXPORT_STATUS_META } from "../panel-state";
import {
  COMIC_EXPORT_FORMATS,
  type ComicExport,
  type ComicExportFormat,
  type ComicPage,
} from "../schema";

const FORMAT_META = {
  psd: {
    label: "Layered PSD",
    icon: Layers,
    hint: "One folder per panel. Background and character on their own layers, so you can keep painting.",
  },
  png: {
    label: "Flat PNG",
    icon: FileImage,
    hint: "One image of the whole page with the lettering drawn in. Ready to post.",
  },
} satisfies Record<ComicExportFormat, { label: string; icon: LucideIcon; hint: string }>;

function isFormat(value: string): value is ComicExportFormat {
  return COMIC_EXPORT_FORMATS.some((format) => format === value);
}

function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function JobRow({
  job,
  hydrated,
  retrying,
  onRetry,
}: {
  readonly job: ComicExport;
  readonly hydrated: boolean;
  readonly retrying: boolean;
  readonly onRetry: (id: string) => void;
}) {
  const status = EXPORT_STATUS_META[job.status];
  const format = FORMAT_META[job.format];
  return (
    <li className="flex flex-col gap-2 rounded-sm p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <format.icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{job.summary}</span>
        </span>
        <Badge variant={status.badge}>
          <status.icon aria-hidden="true" />
          {status.label}
        </Badge>
      </div>
      {job.status === "preparing" ? (
        <p className="text-xs text-muted-foreground">Gathering the selected takes and bubbles.</p>
      ) : null}
      {job.status === "rendering" ? (
        <div className="flex items-center gap-3">
          <Progress value={job.progress} aria-label={`Rendering ${String(job.progress)}%`} />
          <span className="tabular text-xs text-muted-foreground">{job.progress}%</span>
        </div>
      ) : null}
      {job.status === "ready" ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="sm">
            <a href={job.downloadUrl} download>
              <Download aria-hidden="true" /> Download {job.fileName}
            </a>
          </Button>
          <span className="text-xs text-muted-foreground">
            Sample file: a layer manifest stands in for the render.{" "}
            {hydrated
              ? `Link expires in ${formatDistanceToNowStrict(new Date(job.expiresAt))}.`
              : "Link lasts 7 days."}
          </span>
        </div>
      ) : null}
      {job.status === "failed" ? (
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
      ) : null}
    </li>
  );
}

/** Export the page as a layered PSD or a flat PNG, with the page's export history. */
export function PageExport({ page }: { readonly page: ComicPage }) {
  const formatId = useId();
  const start = useStartComicExport(page.id);
  const retry = useRetryComicExport(page.id);
  const hydrated = useHydrated();
  const [format, setFormat] = useState<ComicExportFormat>("psd");
  const [bubblesAsText, setBubblesAsText] = useState(true);
  const [separateBackground, setSeparateBackground] = useState(true);
  const blocker = exportBlocker(page);

  return (
    <Section
      title="Export page"
      titleId="comic-export-heading"
      count={page.exports.length}
      footer="Large exports run in the background. Download links last 7 days."
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-3 rounded-sm bg-card p-3">
          <span id={formatId} className="text-sm font-medium">
            Format
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            spacing={1}
            aria-labelledby={formatId}
            value={format}
            onValueChange={(next) => {
              if (isFormat(next)) setFormat(next);
            }}
            className="flex-wrap"
          >
            {COMIC_EXPORT_FORMATS.map((option) => {
              const meta = FORMAT_META[option];
              return (
                <ToggleGroupItem
                  key={option}
                  value={option}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <meta.icon aria-hidden="true" /> {meta.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">{FORMAT_META[format].hint}</p>

          {format === "psd" ? (
            <div className="-mx-3 flex flex-col">
              <SwitchRow
                label="Bubbles as text layers"
                hint="Lettering stays editable in the PSD."
                checked={bubblesAsText}
                onChange={setBubblesAsText}
              />
              <SwitchRow
                label="Background separate from character"
                hint="Edges may need cleanup around hair and motion blur."
                checked={separateBackground}
                onChange={setSeparateBackground}
              />
            </div>
          ) : null}

          {blocker === null ? null : (
            <p className="text-xs text-flag-foreground" aria-live="polite">
              {blocker}
            </p>
          )}

          <div>
            <Button
              disabled={start.isPending}
              onClick={() => {
                start.mutate({ format, bubblesAsText, separateBackground });
              }}
            >
              <Download aria-hidden="true" /> Export {FORMAT_META[format].label}
            </Button>
          </div>
        </div>

        {page.exports.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            Exports of this page show up here, with their download links.
          </p>
        ) : (
          <ul className="flex flex-col gap-1" aria-live="polite">
            {page.exports.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                hydrated={hydrated}
                retrying={retry.isPending && retry.variables === job.id}
                onRetry={(id) => {
                  retry.mutate(id);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
