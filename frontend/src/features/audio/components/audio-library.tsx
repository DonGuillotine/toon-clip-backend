"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Check,
  CircleAlert,
  Clock,
  Ellipsis,
  Loader,
  type LucideIcon,
  Mic,
  Music,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCredits } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";

import { useDeleteClip, useRenameClip, useRetryClip } from "../mutations";
import {
  type AudioClip,
  type AudioClipStatus,
  type AudioKind,
  type LibraryFilter as Filter,
  LIBRARY_FILTERS as FILTERS,
  type Voice,
} from "../schema";
import { PreviewPlayer } from "./preview-player";
import { RenameDialog } from "./rename-dialog";

/** Library filter, kept in the URL as `kind`. */

const FILTER_LABEL = {
  all: "All",
  music: "Music",
  speech: "Voice lines",
} satisfies Record<Filter, string>;

function isFilter(value: string): value is Filter {
  return FILTERS.some((filter) => filter === value);
}

/** Every clip state carries an icon and a word, never colour alone. */
const STATUS_META = {
  queued: { label: "Queued", icon: Clock, variant: "default" },
  generating: { label: "Generating", icon: Loader, variant: "live" },
  ready: { label: "Ready", icon: Check, variant: "default" },
  failed: { label: "Failed", icon: CircleAlert, variant: "destructive" },
} satisfies Record<
  AudioClipStatus,
  { label: string; icon: LucideIcon; variant: "default" | "live" | "destructive" }
>;

const KIND_META = {
  music: { label: "Music", icon: Music },
  speech: { label: "Voice line", icon: Mic },
} satisfies Record<AudioKind, { label: string; icon: LucideIcon }>;

/** Optimistic rows have no server id yet, so they cannot be edited. */
const isPending = (clip: AudioClip): boolean => clip.id.startsWith("pending_");

export function AudioLibrary({
  clips,
  voices,
}: {
  readonly clips: readonly AudioClip[];
  readonly voices: readonly Voice[];
}) {
  const [filter, setFilter] = useQueryState(
    "kind",
    parseAsStringLiteral(FILTERS).withDefault("all"),
  );
  const shown = filter === "all" ? clips : clips.filter((clip) => clip.kind === filter);

  return (
    <Section
      title="Library"
      titleId="audio-library"
      count={clips.length}
      description="Everything you have made. Clips update on their own while they generate."
      action={
        <ToggleGroup
          type="single"
          size="sm"
          spacing={1}
          aria-label="Show"
          value={filter}
          onValueChange={(next) => {
            if (isFilter(next)) void setFilter(next);
          }}
        >
          {FILTERS.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {FILTER_LABEL[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    >
      {shown.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
          {filter === "all"
            ? "Nothing here yet. Music and voice lines you make are kept here."
            : `No ${FILTER_LABEL[filter].toLowerCase()} yet.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((clip) => (
            <ClipRow
              key={clip.id}
              clip={clip}
              voiceName={voices.find((voice) => voice.id === clip.voiceId)?.name ?? null}
            />
          ))}
        </ul>
      )}
    </Section>
  );
}

function ClipRow({
  clip,
  voiceName,
}: {
  readonly clip: AudioClip;
  readonly voiceName: string | null;
}) {
  const hydrated = useHydrated();
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rename = useRenameClip();
  const remove = useDeleteClip();
  const status = STATUS_META[clip.status];
  const kind = KIND_META[clip.kind];
  const StatusIcon = status.icon;
  const KindIcon = kind.icon;
  const pending = isPending(clip);

  return (
    <li className="flex flex-col gap-2 rounded-sm px-3 py-3 hover:bg-card">
      <div className="flex flex-wrap items-center gap-2">
        <KindIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">{kind.label}:</span>
        <span className="min-w-0 truncate text-sm font-medium">{clip.title}</span>
        <Badge variant={status.variant}>
          <StatusIcon aria-hidden="true" /> {status.label}
        </Badge>
        <span className="ms-auto text-xs text-muted-foreground">
          {hydrated && !pending
            ? `${formatDistanceToNowStrict(new Date(clip.createdAt))} ago`
            : null}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label={`More for ${clip.title}`}
            >
              <Ellipsis aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setRenaming(true);
              }}
            >
              <Pencil aria-hidden="true" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={clip.status !== "ready"}>
              <Link href={`/create?tab=audio&audio=${encodeURIComponent(clip.id)}`}>
                <Sparkles aria-hidden="true" /> Use in Quick create
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setDeleting(true);
              }}
            >
              <Trash2 aria-hidden="true" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground">
        {clip.kind === "speech" && voiceName !== null ? `${voiceName}: ` : null}
        {clip.text}
      </p>

      <ClipStatus clip={clip} />

      <p className="tabular text-xs text-muted-foreground">
        {clip.summary}
        {clip.credits > 0 ? `, ${formatCredits(clip.credits)} credits` : null}
      </p>

      <RenameDialog
        open={renaming}
        noun="clip"
        current={clip.title}
        maxLength={60}
        onOpenChange={setRenaming}
        onSave={(title) => {
          rename.mutate({ id: clip.id, title });
          setRenaming(false);
        }}
      />

      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {clip.title}?</DialogTitle>
            <DialogDescription>
              It leaves your library. Storyboards that already use it keep their copy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Keep it</Button>
            </DialogClose>
            <Button
              onClick={() => {
                remove.mutate(clip);
                setDeleting(false);
              }}
            >
              Delete clip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function ClipStatus({ clip }: { readonly clip: AudioClip }) {
  const retry = useRetryClip();

  switch (clip.status) {
    case "queued":
      return <p className="text-xs text-muted-foreground">Waiting for a free slot.</p>;
    case "generating":
      return (
        <div className="flex items-center gap-3">
          <Progress
            value={clip.progress}
            aria-label={`Generating ${clip.title}, ${String(clip.progress)}%`}
          />
          <span className="tabular w-10 shrink-0 text-end text-xs text-muted-foreground">
            {clip.progress}%
          </span>
        </div>
      );
    case "ready":
      return <PreviewPlayer id={clip.id} label={clip.title} durationSec={clip.durationSec} />;
    case "failed":
      return (
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-destructive-foreground">{clip.reason}</p>
          <p className="tabular text-xs text-muted-foreground">
            {formatCredits(clip.refunded)} credits refunded.
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={retry.isPending}
            onClick={() => {
              retry.mutate(clip.id);
            }}
          >
            <RotateCcw aria-hidden="true" /> Try again, {formatCredits(clip.credits)} credits
          </Button>
        </div>
      );
  }
}
