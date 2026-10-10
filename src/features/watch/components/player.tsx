"use client";

import {
  Captions,
  Clapperboard,
  FileDown,
  Maximize,
  Minimize,
  Pause,
  Play,
  Rewind,
  FastForward,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef } from "react";

import { CoverArt } from "@/components/comic/cover-art";
import { Card } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { ARROW_STEP_SEC, describeRate, segmentAt } from "../playback";
import { type WatchItem } from "../schema";
import { keyBelongsToTarget, PLAYER_SHORTCUTS, playerCommandFor } from "../shortcuts";
import { useFullscreen } from "../use-fullscreen";
import { usePlayhead } from "../use-playhead";

const STAGE_SHAPE = {
  "16:9": "aspect-video w-full",
  "9:16": "aspect-9/16 h-[min(70dvh,40rem)] max-w-full",
  "1:1": "aspect-square h-[min(70dvh,36rem)] max-w-full",
} satisfies Record<WatchItem["aspectRatio"], string>;

type PlayerProps = {
  readonly item: WatchItem;
  readonly captions: boolean;
  readonly onCaptionsChange: (on: boolean) => void;
};

/**
 * Plays a finished clip. Until takes carry real media, each segment shows its
 * take's placeholder art in sequence, driven by a real playhead, so timing,
 * scrubbing, shuttle and captions all behave as they will with video.
 *
 * Remount with `key={item.id}` to start a different clip from zero.
 */
export function Player({ item, captions, onCaptionsChange }: PlayerProps) {
  const playhead = usePlayhead(item.durationSec);
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const current = segmentAt(item.segments, playhead.timeSec);
  const playing = playhead.rate !== 0;
  const caption = captions ? (current?.segment.caption ?? null) : null;

  const { toggle, pause, shuttle, nudge, seek } = playhead;
  const toggleFullscreen = fullscreen.toggle;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || keyBelongsToTarget(event.target, event.key)) return;
      const command = playerCommandFor(event);
      if (command === null) return;
      event.preventDefault();
      switch (command) {
        case "play":
          toggle();
          return;
        case "back":
          shuttle("backward");
          return;
        case "pause":
          pause();
          return;
        case "forward":
          shuttle("forward");
          return;
        case "stepBack":
          nudge(-ARROW_STEP_SEC);
          return;
        case "stepForward":
          nudge(ARROW_STEP_SEC);
          return;
        case "start":
          seek(0);
          return;
        case "end":
          seek(item.durationSec);
          return;
        case "captions":
          onCaptionsChange(!captions);
          return;
        case "fullscreen":
          toggleFullscreen();
          return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    toggle,
    pause,
    shuttle,
    nudge,
    seek,
    item.durationSec,
    captions,
    onCaptionsChange,
    toggleFullscreen,
  ]);

  return (
    <Card aria-labelledby="player-title" className="flex flex-col gap-2">
      <header className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-3 pt-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="player-title" className="truncate text-base font-semibold tracking-tight">
            {item.title}
          </h2>
          <p className="tabular text-xs text-muted-foreground">
            {item.subtitle} · {item.aspectRatio} · {formatDuration(item.durationSec)}
            {item.skippedShots > 0
              ? ` · ${String(item.skippedShots)} unfinished ${item.skippedShots === 1 ? "shot" : "shots"} left out`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.storyboardId === null ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/create">
                <Sparkles aria-hidden="true" /> Open Quick create
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/storyboards/${item.storyboardId}`}>
                  <Clapperboard aria-hidden="true" /> Open timeline
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/storyboards/${item.storyboardId}/export`}>
                  <FileDown aria-hidden="true" /> Export
                </Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex justify-center rounded-md bg-muted p-1">
        <div
          ref={stageRef}
          className={cn(
            "relative isolate overflow-hidden rounded-sm bg-comic-ink",
            fullscreen.active
              ? "flex size-full items-center justify-center"
              : STAGE_SHAPE[item.aspectRatio],
          )}
        >
          <AnimatePresence initial={false}>
            {current ? (
              <motion.div
                key={current.segment.id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.menu}
              >
                <CoverArt
                  art={current.segment.art}
                  sfx={current.index === 0 ? item.cover.sfx : null}
                  className="size-full"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2">
            <Badge variant="overlay">Sample art</Badge>
            {current ? <Badge variant="overlay">{current.segment.label}</Badge> : null}
          </div>

          {caption === null ? null : (
            <p
              className="absolute inset-x-4 bottom-4 z-10 mx-auto w-fit max-w-[90%] rounded-sm bg-foreground/85 px-3 py-1.5 text-center text-sm font-medium text-background sm:text-base"
              aria-live="polite"
            >
              {caption}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-2 pb-2">
        <div className="flex items-center gap-3">
          <span className="tabular w-10 shrink-0 text-end text-xs text-muted-foreground">
            {formatDuration(playhead.timeSec)}
          </span>
          <Slider
            aria-label="Playhead"
            min={0}
            max={item.durationSec}
            step={0.1}
            value={[playhead.timeSec]}
            onValueChange={(values) => {
              const next = values[0];
              if (next !== undefined) seek(next);
            }}
            aria-valuetext={`${formatDuration(playhead.timeSec)} of ${formatDuration(item.durationSec)}`}
          />
          <span className="tabular w-10 shrink-0 text-xs text-muted-foreground">
            {formatDuration(item.durationSec)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <IconTool
              label={`Back ${String(ARROW_STEP_SEC)} seconds`}
              keys={["Left"]}
              onClick={() => {
                nudge(-ARROW_STEP_SEC);
              }}
            >
              <Rewind />
            </IconTool>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
                  {playing ? <Pause /> : <Play />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {playing ? "Pause" : "Play"} <Kbd>Space</Kbd>
              </TooltipContent>
            </Tooltip>
            <IconTool
              label={`Forward ${String(ARROW_STEP_SEC)} seconds`}
              keys={["Right"]}
              onClick={() => {
                nudge(ARROW_STEP_SEC);
              }}
            >
              <FastForward />
            </IconTool>
            <span className="ps-2 text-xs text-muted-foreground" aria-live="polite">
              {describeRate(playhead.rate)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={captions} onPressedChange={onCaptionsChange} aria-label="Captions">
                  <Captions aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {captions ? "Captions on" : "Captions off"}
                  </span>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                Captions <Kbd>C</Kbd>
              </TooltipContent>
            </Tooltip>
            <IconTool
              label={fullscreen.active ? "Leave full screen" : "Full screen"}
              keys={["F"]}
              disabled={!fullscreen.supported}
              onClick={toggleFullscreen}
            >
              {fullscreen.active ? <Minimize /> : <Maximize />}
            </IconTool>
          </div>
        </div>
      </div>

      <SegmentStrip
        item={item}
        currentId={current?.segment.id ?? null}
        onJump={(startSec) => {
          seek(startSec);
        }}
      />

      <ShortcutList />
    </Card>
  );
}

function IconTool({
  label,
  keys,
  disabled = false,
  onClick,
  children,
}: {
  readonly label: string;
  readonly keys: readonly string[];
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}{" "}
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/** The shots in playback order. Choosing one moves the playhead to its start. */
function SegmentStrip({
  item,
  currentId,
  onJump,
}: {
  readonly item: WatchItem;
  readonly currentId: string | null;
  readonly onJump: (startSec: number) => void;
}) {
  if (item.segments.length < 2) return null;
  return (
    <div className="rounded-md bg-muted p-1">
      <h3 className="sr-only">Shots</h3>
      <ol className="flex gap-1 overflow-x-auto">
        {item.segments.map((segment, index) => {
          const active = segment.id === currentId;
          return (
            <li key={segment.id} className="shrink-0">
              <Button
                variant="ghost"
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  onJump(segment.startSec);
                }}
                className={cn(
                  "h-auto flex-col items-start gap-1 rounded-sm p-1 text-start",
                  active && "bg-card text-foreground",
                )}
              >
                <span className="relative block h-12 w-20 overflow-hidden rounded-xs">
                  <CoverArt art={segment.art} sfx={null} className="absolute inset-0" />
                </span>
                <span className="tabular px-1 text-xs">
                  {String(index + 1)} · {formatDuration(segment.durationSec)}
                </span>
              </Button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ShortcutList() {
  return (
    <div className="px-3 pb-1">
      <h3 className="pb-2 text-xs font-medium text-muted-foreground">Keyboard</h3>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
        {PLAYER_SHORTCUTS.map((shortcut) => (
          <li key={shortcut.command} className="flex items-center gap-2">
            <span className="flex gap-1">
              {shortcut.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
            {shortcut.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
